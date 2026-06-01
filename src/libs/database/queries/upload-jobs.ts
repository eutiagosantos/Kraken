import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/libs/database";
import { uploadJobs, type Json } from "@/models/schema";
import {
  UPLOAD_JOB_IN_FLIGHT_STATUSES,
  type UploadJobInFlightStatus,
} from "@/libs/wizard/upload-jobs-constants";

export { UPLOAD_JOB_IN_FLIGHT_STATUSES, type UploadJobInFlightStatus };

export type UploadJobRow = typeof uploadJobs.$inferSelect;

const userScope = (userId: string) => eq(uploadJobs.user_id, userId);

export async function listUploadJobs(userId: string, limit: number): Promise<UploadJobRow[]> {
  return db
    .select()
    .from(uploadJobs)
    .where(userScope(userId))
    .orderBy(desc(uploadJobs.started_at))
    .limit(limit);
}

export async function listUploadJobsForApi(
  userId: string,
  limit: number
): Promise<
  Pick<
    UploadJobRow,
    "id" | "account_name" | "total" | "done" | "status" | "started_at" | "finished_at" | "summary" | "error_details"
  >[]
> {
  return db
    .select({
      id: uploadJobs.id,
      account_name: uploadJobs.account_name,
      total: uploadJobs.total,
      done: uploadJobs.done,
      status: uploadJobs.status,
      started_at: uploadJobs.started_at,
      finished_at: uploadJobs.finished_at,
      summary: uploadJobs.summary,
      error_details: uploadJobs.error_details,
    })
    .from(uploadJobs)
    .where(userScope(userId))
    .orderBy(desc(uploadJobs.started_at))
    .limit(limit);
}

export async function listUploadJobsForQueueSummary(
  userId: string,
  limit: number
): Promise<Pick<UploadJobRow, "total" | "done" | "status" | "started_at" | "finished_at">[]> {
  return db
    .select({
      total: uploadJobs.total,
      done: uploadJobs.done,
      status: uploadJobs.status,
      started_at: uploadJobs.started_at,
      finished_at: uploadJobs.finished_at,
    })
    .from(uploadJobs)
    .where(userScope(userId))
    .orderBy(desc(uploadJobs.started_at))
    .limit(limit);
}

export async function getUploadJobById(userId: string, jobId: string): Promise<UploadJobRow | null> {
  const [row] = await db
    .select()
    .from(uploadJobs)
    .where(and(eq(uploadJobs.id, jobId), userScope(userId)))
    .limit(1);
  return row ?? null;
}

export async function getUploadJobStatus(
  userId: string,
  jobId: string
): Promise<Pick<UploadJobRow, "status" | "error_details"> | null> {
  const [row] = await db
    .select({
      status: uploadJobs.status,
      error_details: uploadJobs.error_details,
    })
    .from(uploadJobs)
    .where(and(eq(uploadJobs.id, jobId), userScope(userId)))
    .limit(1);
  return row ?? null;
}

export async function getUploadJobForPublish(
  userId: string,
  jobId: string
): Promise<Pick<UploadJobRow, "id" | "status"> | null> {
  const [row] = await db
    .select({
      id: uploadJobs.id,
      status: uploadJobs.status,
    })
    .from(uploadJobs)
    .where(and(eq(uploadJobs.id, jobId), userScope(userId)))
    .limit(1);
  return row ?? null;
}

export async function findInFlightUploadJobId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: uploadJobs.id })
    .from(uploadJobs)
    .where(and(userScope(userId), inArray(uploadJobs.status, [...UPLOAD_JOB_IN_FLIGHT_STATUSES])))
    .limit(1);
  return row?.id ?? null;
}

export async function createAwaitingCreativesUploadJob(
  userId: string,
  accountName: string
): Promise<{ id: string } | null> {
  const [row] = await db
    .insert(uploadJobs)
    .values({
      user_id: userId,
      account_name: accountName,
      total: 0,
      done: 0,
      status: "awaiting_creatives",
      started_at: new Date().toISOString(),
    })
    .returning({ id: uploadJobs.id });
  return row ?? null;
}

export async function deleteUploadJob(userId: string, jobId: string): Promise<void> {
  await db.delete(uploadJobs).where(and(eq(uploadJobs.id, jobId), userScope(userId)));
}

export async function markUploadJobError(
  userId: string,
  jobId: string,
  errorDetails: Json
): Promise<void> {
  await db
    .update(uploadJobs)
    .set({
      status: "error",
      finished_at: new Date().toISOString(),
      error_details: errorDetails,
    })
    .where(and(eq(uploadJobs.id, jobId), userScope(userId)));
}

export async function startUploadJobProcessing(
  userId: string,
  jobId: string,
  data: {
    account_name: string;
    total: number;
    summary: Json;
  }
): Promise<{ id: string } | null> {
  const [row] = await db
    .update(uploadJobs)
    .set({
      account_name: data.account_name,
      total: data.total,
      done: 0,
      status: "processing",
      summary: data.summary,
    })
    .where(and(eq(uploadJobs.id, jobId), userScope(userId)))
    .returning({ id: uploadJobs.id });
  return row ?? null;
}

export async function updateUploadJobDone(userId: string, jobId: string, done: number): Promise<void> {
  await db
    .update(uploadJobs)
    .set({ done })
    .where(and(eq(uploadJobs.id, jobId), userScope(userId)));
}

export async function updateUploadJobProgress(
  userId: string,
  jobId: string,
  done: number,
  summary: Record<string, unknown>,
  phase: string
): Promise<void> {
  await db
    .update(uploadJobs)
    .set({
      done,
      summary: { ...summary, v: 1, publishPhase: phase, publishDone: done } as Json,
    })
    .where(and(eq(uploadJobs.id, jobId), userScope(userId)));
}

export async function finalizeUploadJob(
  userId: string,
  jobId: string,
  data: {
    status: "completed" | "error";
    finished_at: string;
    error_details: Json | null;
  }
): Promise<void> {
  await db
    .update(uploadJobs)
    .set({
      status: data.status,
      finished_at: data.finished_at,
      error_details: data.error_details,
    })
    .where(and(eq(uploadJobs.id, jobId), userScope(userId)));
}
