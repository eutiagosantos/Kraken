import "server-only";

import { db } from "@/libs/database";
import { isPostgresUniqueViolation } from "@/libs/database/postgres-error";
import { metaCatalogs } from "@/models/schema";

export type MetaCatalogInsert = typeof metaCatalogs.$inferInsert;

export async function insertMetaCatalog(
  values: Omit<MetaCatalogInsert, "created_at" | "updated_at" | "id"> & {
    id?: string;
    created_at?: string;
    updated_at?: string;
  }
): Promise<{ ok: true } | { ok: false; error: string; duplicate: boolean }> {
  const now = new Date().toISOString();
  try {
    await db.insert(metaCatalogs).values({
      created_at: now,
      updated_at: now,
      ...values,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      duplicate: isPostgresUniqueViolation(err),
    };
  }
}
