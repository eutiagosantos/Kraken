import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/libs/database";
import type { Json } from "@/models/schema";
import { savedPublicos } from "@/models/schema";

export async function listSavedPublicoPayloadsByUserId(
  userId: string,
  limit: number
): Promise<Json[]> {
  const rows = await db
    .select({ payload: savedPublicos.payload })
    .from(savedPublicos)
    .where(eq(savedPublicos.user_id, userId))
    .orderBy(desc(savedPublicos.created_at))
    .limit(limit);
  return rows.map((row) => row.payload);
}

export async function insertSavedPublico(userId: string, payload: Json): Promise<void> {
  await db.insert(savedPublicos).values({
    user_id: userId,
    payload,
    created_at: new Date().toISOString(),
  });
}
