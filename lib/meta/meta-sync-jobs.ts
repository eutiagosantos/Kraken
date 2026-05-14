import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/types";

export type MetaSyncJobType = "feed_validate" | "feed_sync_url";

export async function enqueueMetaSyncJob(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    jobType: MetaSyncJobType;
    payload: Json;
    idempotencyKey?: string | null;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const row = {
    user_id: input.userId,
    job_type: input.jobType,
    payload: input.payload,
    idempotency_key: input.idempotencyKey?.trim() || null,
    status: "pending",
    next_run_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("meta_sync_jobs").insert(row).select("id").single();
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Job duplicado (idempotency_key)." };
    }
    return { ok: false, error: error.message };
  }
  if (!data?.id) return { ok: false, error: "Insert sem id." };
  return { ok: true, id: data.id };
}
