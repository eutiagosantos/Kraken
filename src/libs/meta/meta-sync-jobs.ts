import type { Json } from "@/models/schema";

import { enqueueMetaSyncJobRow } from "@/libs/database/queries/meta-sync-jobs";

export type MetaSyncJobType = "feed_validate" | "feed_sync_url";

export async function enqueueMetaSyncJob(input: {
  userId: string;
  jobType: MetaSyncJobType;
  payload: Json;
  idempotencyKey?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  return enqueueMetaSyncJobRow({
    userId: input.userId,
    jobType: input.jobType,
    payload: input.payload,
    idempotencyKey: input.idempotencyKey,
  });
}
