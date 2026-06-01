import "server-only";

import { and, asc, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/libs/database";
import { isPostgresUniqueViolation } from "@/libs/database/postgres-error";
import type { Json } from "@/models/schema";
import { metaSyncJobs } from "@/models/schema";

export type MetaSyncJobRow = typeof metaSyncJobs.$inferSelect;
export type MetaSyncJobDueRow = Pick<
  MetaSyncJobRow,
  "id" | "user_id" | "job_type" | "payload" | "status" | "attempt_count"
>;

export async function enqueueMetaSyncJobRow(input: {
  userId: string;
  jobType: string;
  payload: Json;
  idempotencyKey?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const now = new Date().toISOString();
    const [row] = await db
      .insert(metaSyncJobs)
      .values({
        user_id: input.userId,
        job_type: input.jobType,
        payload: input.payload,
        idempotency_key: input.idempotencyKey?.trim() || null,
        status: "pending",
        next_run_at: now,
        attempt_count: 0,
        created_at: now,
        updated_at: now,
      })
      .returning({ id: metaSyncJobs.id });
    if (!row?.id) return { ok: false, error: "Insert sem id." };
    return { ok: true, id: row.id };
  } catch (err) {
    if (isPostgresUniqueViolation(err)) {
      return { ok: false, error: "Job duplicado (idempotency_key)." };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listDueMetaSyncJobs(now: string, maxJobs: number): Promise<MetaSyncJobDueRow[]> {
  return db
    .select({
      id: metaSyncJobs.id,
      user_id: metaSyncJobs.user_id,
      job_type: metaSyncJobs.job_type,
      payload: metaSyncJobs.payload,
      status: metaSyncJobs.status,
      attempt_count: metaSyncJobs.attempt_count,
    })
    .from(metaSyncJobs)
    .where(
      and(
        inArray(metaSyncJobs.status, ["pending", "retry_scheduled"]),
        lte(metaSyncJobs.next_run_at, now)
      )
    )
    .orderBy(asc(metaSyncJobs.next_run_at))
    .limit(maxJobs);
}

export async function markMetaSyncJobRunning(id: string, updatedAt: string): Promise<void> {
  await db
    .update(metaSyncJobs)
    .set({ status: "running", updated_at: updatedAt })
    .where(eq(metaSyncJobs.id, id));
}

export async function completeMetaSyncJobSuccess(
  id: string,
  lastError: Json,
  updatedAt: string
): Promise<void> {
  await db
    .update(metaSyncJobs)
    .set({
      status: "success",
      last_error: lastError,
      updated_at: updatedAt,
    })
    .where(eq(metaSyncJobs.id, id));
}

export async function updateMetaSyncJobFailure(
  id: string,
  input: {
    status: "dead_letter" | "retry_scheduled";
    attemptCount: number;
    nextRunAt: string;
    lastError: Json;
    updatedAt: string;
  }
): Promise<void> {
  await db
    .update(metaSyncJobs)
    .set({
      status: input.status,
      attempt_count: input.attemptCount,
      next_run_at: input.nextRunAt,
      last_error: input.lastError,
      updated_at: input.updatedAt,
    })
    .where(eq(metaSyncJobs.id, id));
}
