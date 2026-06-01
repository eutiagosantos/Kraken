import {
  completeMetaSyncJobSuccess,
  listDueMetaSyncJobs,
  markMetaSyncJobRunning,
  updateMetaSyncJobFailure,
  type MetaSyncJobDueRow,
} from "@/libs/database/queries/meta-sync-jobs";
import { getMetaUserToken } from "@/libs/database/queries/meta-user-tokens";
import { graphCreateProductFeedUpload, graphGetProductFeedUpload } from "@/libs/meta/product-feeds-graph";
import type { ProductFeedRow } from "@/libs/meta/validate-product-feed";
import { validateFeed } from "@/libs/meta/validate-product-feed";
import type { Json } from "@/models/schema";

const MAX_ATTEMPTS = 5;

function backoffMs(attempt: number): number {
  return Math.min(3_600_000, 15_000 * 2 ** Math.max(0, attempt - 1));
}

async function failJob(job: MetaSyncJobDueRow, err: unknown, attempt: number): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const nextAttempt = attempt + 1;
  const dead = nextAttempt >= MAX_ATTEMPTS;
  const nextRun = new Date(Date.now() + backoffMs(nextAttempt)).toISOString();
  const now = new Date().toISOString();
  await updateMetaSyncJobFailure(job.id, {
    status: dead ? "dead_letter" : "retry_scheduled",
    attemptCount: nextAttempt,
    nextRunAt: dead ? now : nextRun,
    lastError: { message } as unknown as Json,
    updatedAt: now,
  });
}

/** Processes due `meta_sync_jobs` (reads `meta_user_tokens` via Drizzle). */
export async function processMetaSyncJobsBatch(
  maxJobs = 15
): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  const now = new Date().toISOString();
  const jobs = await listDueMetaSyncJobs(now, maxJobs);

  if (!jobs.length) return { processed: 0, errors: [] };

  let processed = 0;
  for (const job of jobs) {
    const attempt = job.attempt_count ?? 0;
    await markMetaSyncJobRunning(job.id, now);

    const tok = await getMetaUserToken(job.user_id);

    if (!tok?.access_token) {
      await failJob(job, new Error("meta_user_tokens em falta."), attempt);
      errors.push(`job ${job.id}: sem token`);
      continue;
    }

    const accessToken = tok.access_token;

    try {
      if (job.job_type === "feed_validate") {
        const p = job.payload as { rows?: ProductFeedRow[] };
        const rows = Array.isArray(p.rows) ? p.rows : [];
        const validation = validateFeed(rows);
        await completeMetaSyncJobSuccess(job.id, { validation } as unknown as Json, now);
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
        await completeMetaSyncJobSuccess(
          job.id,
          { uploadId: up.id, uploadStatus: status } as unknown as Json,
          now
        );
        processed += 1;
        continue;
      }

      throw new Error(`Tipo de job desconhecido: ${job.job_type}`);
    } catch (e) {
      await failJob(job, e, attempt);
      errors.push(`job ${job.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { processed, errors };
}
