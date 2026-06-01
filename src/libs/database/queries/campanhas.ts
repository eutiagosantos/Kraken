import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/libs/database";
import { campanhas } from "@/models/schema";

export type CampanhaRow = typeof campanhas.$inferSelect;
export type CampanhaInsert = typeof campanhas.$inferInsert;
export type CampanhaUpdate = Partial<
  Pick<
    CampanhaInsert,
    | "name"
    | "account_name"
    | "account_meta_id"
    | "structure"
    | "objective"
    | "daily_budget"
    | "anti_spy"
    | "status"
    | "ads_created"
    | "ads_total"
    | "trend"
    | "creatives"
    | "errors"
    | "meta_ids"
  >
>;

export async function listCampanhasByUserId(userId: string): Promise<CampanhaRow[]> {
  return db
    .select()
    .from(campanhas)
    .where(eq(campanhas.user_id, userId))
    .orderBy(desc(campanhas.created_at));
}

export async function listCampanhaSummariesByUserId(
  userId: string,
  limit: number
): Promise<
  Pick<
    CampanhaRow,
    | "id"
    | "name"
    | "account_name"
    | "account_meta_id"
    | "structure"
    | "objective"
    | "daily_budget"
    | "status"
    | "ads_created"
    | "ads_total"
    | "created_at"
  >[]
> {
  return db
    .select({
      id: campanhas.id,
      name: campanhas.name,
      account_name: campanhas.account_name,
      account_meta_id: campanhas.account_meta_id,
      structure: campanhas.structure,
      objective: campanhas.objective,
      daily_budget: campanhas.daily_budget,
      status: campanhas.status,
      ads_created: campanhas.ads_created,
      ads_total: campanhas.ads_total,
      created_at: campanhas.created_at,
    })
    .from(campanhas)
    .where(eq(campanhas.user_id, userId))
    .orderBy(desc(campanhas.created_at))
    .limit(limit);
}

export async function getCampanhaByIdForUser(
  userId: string,
  id: string
): Promise<CampanhaRow | null> {
  const [row] = await db
    .select()
    .from(campanhas)
    .where(and(eq(campanhas.id, id), eq(campanhas.user_id, userId)))
    .limit(1);
  return row ?? null;
}

export async function insertCampanha(
  values: Omit<CampanhaInsert, "created_at" | "id"> & { id?: string; created_at?: string }
): Promise<CampanhaRow> {
  const [row] = await db
    .insert(campanhas)
    .values({
      created_at: new Date().toISOString(),
      ...values,
    })
    .returning();
  if (!row) throw new Error("Insert campanha sem linha devolvida.");
  return row;
}

export async function insertCampanhaReturningId(
  values: Omit<CampanhaInsert, "created_at" | "id"> & { id?: string; created_at?: string }
): Promise<{ id: string }> {
  const [row] = await db
    .insert(campanhas)
    .values({
      created_at: new Date().toISOString(),
      ...values,
    })
    .returning({ id: campanhas.id });
  if (!row) throw new Error("Insert campanha sem id devolvido.");
  return row;
}

export async function updateCampanhaForUser(
  userId: string,
  id: string,
  updates: CampanhaUpdate
): Promise<CampanhaRow | null> {
  const [row] = await db
    .update(campanhas)
    .set(updates)
    .where(and(eq(campanhas.id, id), eq(campanhas.user_id, userId)))
    .returning();
  return row ?? null;
}

export async function deleteCampanhaForUser(userId: string, id: string): Promise<void> {
  await db.delete(campanhas).where(and(eq(campanhas.id, id), eq(campanhas.user_id, userId)));
}
