import type { SupabaseClient } from "@supabase/supabase-js";

import { graphCreateProductFeedUpload, graphGetProductFeedUpload } from "@/lib/meta/product-feeds-graph";
import type { ProductFeedRow } from "@/lib/meta/validate-product-feed";
import { validateFeed } from "@/lib/meta/validate-product-feed";
import type { Database, Json } from "@/lib/supabase/types";

const MAX_ATTEMPTS = 5;

function backoffMs(attempt: number): number {
  return Math.min(3_600_000, 15_000 * 2 ** Math.max(0, attempt - 1));
}

type MetaSyncJobRow = {
  id: string;
  user_id: string;
  job_type: string;
  payload: Json;
  status: string;
  attempt_count: number;
};

async function failJob(
  service: SupabaseClient<Database>,
  job: MetaSyncJobRow,
  err: unknown,
  attempt: number
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const nextAttempt = attempt + 1;
  const dead = nextAttempt >= MAX_ATTEMPTS;
  const nextRun = new Date(Date.now() + backoffMs(nextAttempt)).toISOString();
  await service
    .from("meta_sync_jobs")
    .update({
      status: dead ? "dead_letter" : "retry_scheduled",
      attempt_count: nextAttempt,
      next_run_at: dead ? new Date().toISOString() : nextRun,
      last_error: { message } as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);
}

/** Processes due `meta_sync_jobs` using the service-role client (reads `meta_user_tokens`). */
export async function processMetaSyncJobsBatch(
  service: SupabaseClient<Database>,
  maxJobs = 15
): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  const now = new Date().toISOString();
  const { data: jobs, error: qErr } = await service
    .from("meta_sync_jobs")
    .select("id,user_id,job_type,payload,status,attempt_count")
    .in("status", ["pending", "retry_scheduled"])
    .lte("next_run_at", now)
    .order("next_run_at", { ascending: true })
    .limit(maxJobs);

  if (qErr) {
    return { processed: 0, errors: [qErr.message] };
  }
  if (!jobs?.length) return { processed: 0, errors: [] };

  let processed = 0;
  for (const job of jobs) {
    const attempt = job.attempt_count ?? 0;
    await service
      .from("meta_sync_jobs")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .eq("id", job.id);

    const { data: tok, error: tErr } = await service
      .from("meta_user_tokens")
      .select("access_token")
      .eq("user_id", job.user_id)
      .maybeSingle();

    if (tErr || !tok?.access_token) {
      await failJob(service, job as MetaSyncJobRow, new Error("meta_user_tokens em falta."), attempt);
      errors.push(`job ${job.id}: sem token`);
      continue;
    }

    const accessToken = tok.access_token;

    try {
      if (job.job_type === "feed_validate") {
        const p = job.payload as { rows?: ProductFeedRow[] };
        const rows = Array.isArray(p.rows) ? p.rows : [];
        const validation = validateFeed(rows);
        await service
          .from("meta_sync_jobs")
          .update({
            status: "success",
            last_error: { validation } as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        processed += 1;
        continue;
      }

      if (job.job_type === "feed_sync_url") {
        const p = job.payload as { feedId?: string; url?: string };
        const feedId = p.feedId?.trim();
        const url = p.url?.trim();
        if (!feedId || !url) throw new Error("feed_sync_url: feedId e url são obrigatórios.");
        const up = await graphCreateProductFeedUpload({ feedId, accessToken, url });
        const status = await graphGetProductFeedUpload({ uploadId: up.id, accessToken });
        await service
          .from("meta_sync_jobs")
          .update({
            status: "success",
            last_error: { uploadId: up.id, uploadStatus: status } as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        processed += 1;
        continue;
      }

      throw new Error(`Tipo de job desconhecido: ${job.job_type}`);
    } catch (e) {
      await failJob(service, job as MetaSyncJobRow, e, attempt);
      errors.push(`job ${job.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { processed, errors };
}
