import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/libs/database";
import { creativeLibraryItems } from "@/models/schema";

export type CreativeLibraryItemRow = typeof creativeLibraryItems.$inferSelect;

export async function listCreativeLibraryItemsByUserId(
  userId: string,
  limit: number
): Promise<CreativeLibraryItemRow[]> {
  return db
    .select()
    .from(creativeLibraryItems)
    .where(eq(creativeLibraryItems.user_id, userId))
    .orderBy(desc(creativeLibraryItems.created_at))
    .limit(limit);
}
