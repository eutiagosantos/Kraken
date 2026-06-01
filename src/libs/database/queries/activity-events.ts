import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/libs/database";
import { activityEvents } from "@/models/schema";

export type ActivityEventRow = typeof activityEvents.$inferSelect;
export type ActivityEventInsert = typeof activityEvents.$inferInsert;

export async function listActivityEventsByUserId(
  userId: string,
  limit: number
): Promise<ActivityEventRow[]> {
  return db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.user_id, userId))
    .orderBy(desc(activityEvents.created_at))
    .limit(limit);
}

export async function listActivityEventNotificationsByUserId(
  userId: string,
  limit: number
): Promise<
  Pick<ActivityEventRow, "id" | "type" | "message" | "account" | "created_at">[]
> {
  return db
    .select({
      id: activityEvents.id,
      type: activityEvents.type,
      message: activityEvents.message,
      account: activityEvents.account,
      created_at: activityEvents.created_at,
    })
    .from(activityEvents)
    .where(eq(activityEvents.user_id, userId))
    .orderBy(desc(activityEvents.created_at))
    .limit(limit);
}

export async function insertActivityEvent(
  values: Omit<ActivityEventInsert, "created_at" | "id"> & { id?: string; created_at?: string }
): Promise<void> {
  await db.insert(activityEvents).values({
    created_at: new Date().toISOString(),
    ...values,
  });
}
