import "server-only";

import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/libs/database";
import { metaAdAccounts } from "@/models/schema";

export type MetaAdAccountRow = typeof metaAdAccounts.$inferSelect;
export type MetaAdAccountInsert = typeof metaAdAccounts.$inferInsert;
export type MetaAdAccountUpdate = Partial<Omit<MetaAdAccountInsert, "id" | "user_id">>;

function forUser(userId: string) {
  return eq(metaAdAccounts.user_id, userId);
}

export async function listMetaAdAccountsForUser(userId: string): Promise<MetaAdAccountRow[]> {
  return db
    .select()
    .from(metaAdAccounts)
    .where(forUser(userId))
    .orderBy(desc(metaAdAccounts.connected_at));
}

export async function listMetaAdAccountsForUserByName(userId: string): Promise<MetaAdAccountRow[]> {
  return db
    .select()
    .from(metaAdAccounts)
    .where(forUser(userId))
    .orderBy(asc(metaAdAccounts.name));
}

export async function listMetaAdAccountsSummaryForUser(userId: string) {
  return db
    .select({
      id: metaAdAccounts.id,
      meta_account_id: metaAdAccounts.meta_account_id,
      name: metaAdAccounts.name,
      nickname: metaAdAccounts.nickname,
      status: metaAdAccounts.status,
      facebook_page_id: metaAdAccounts.facebook_page_id,
      default_budget: metaAdAccounts.default_budget,
      connected_at: metaAdAccounts.connected_at,
    })
    .from(metaAdAccounts)
    .where(forUser(userId))
    .orderBy(desc(metaAdAccounts.connected_at));
}

export async function getMetaAdAccountById(
  userId: string,
  id: string
): Promise<MetaAdAccountRow | null> {
  const rows = await db
    .select()
    .from(metaAdAccounts)
    .where(and(forUser(userId), eq(metaAdAccounts.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateMetaAdAccountById(
  userId: string,
  id: string,
  updates: MetaAdAccountUpdate
): Promise<MetaAdAccountRow | null> {
  const rows = await db
    .update(metaAdAccounts)
    .set(updates)
    .where(and(forUser(userId), eq(metaAdAccounts.id, id)))
    .returning();
  return rows[0] ?? null;
}

export async function deleteMetaAdAccountById(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(metaAdAccounts)
    .where(and(forUser(userId), eq(metaAdAccounts.id, id)))
    .returning({ id: metaAdAccounts.id });
  return rows.length > 0;
}

export async function listMetaAccountIdsForUser(userId: string): Promise<string[]> {
  const rows = await db
    .select({ meta_account_id: metaAdAccounts.meta_account_id })
    .from(metaAdAccounts)
    .where(forUser(userId))
    .orderBy(asc(metaAdAccounts.name));
  return rows.map((r) => r.meta_account_id);
}

export async function listOwnedMetaAccountIds(
  userId: string,
  metaAccountIds: string[]
): Promise<string[]> {
  if (metaAccountIds.length === 0) return [];
  const rows = await db
    .select({ meta_account_id: metaAdAccounts.meta_account_id })
    .from(metaAdAccounts)
    .where(and(forUser(userId), inArray(metaAdAccounts.meta_account_id, metaAccountIds)));
  return rows.map((r) => r.meta_account_id);
}

export async function updateFacebookPageForMetaAccounts(
  userId: string,
  metaAccountIds: string[],
  page: {
    facebook_page_id: string;
    facebook_page_name: string | null;
    updated_at: string;
  }
): Promise<void> {
  if (metaAccountIds.length === 0) return;
  await db
    .update(metaAdAccounts)
    .set({
      facebook_page_id: page.facebook_page_id,
      facebook_page_name: page.facebook_page_name,
      updated_at: page.updated_at,
    })
    .where(and(forUser(userId), inArray(metaAdAccounts.meta_account_id, metaAccountIds)));
}

export async function listMetaAdAccountsIdAndName(
  userId: string
): Promise<Array<{ meta_account_id: string; name: string }>> {
  return db
    .select({
      meta_account_id: metaAdAccounts.meta_account_id,
      name: metaAdAccounts.name,
    })
    .from(metaAdAccounts)
    .where(forUser(userId));
}

export async function listMetaAdAccountsByMetaIdsForUser(
  userId: string,
  metaAccountIds: string[]
): Promise<Array<{ meta_account_id: string; name: string }>> {
  if (metaAccountIds.length === 0) return [];
  return db
    .select({
      meta_account_id: metaAdAccounts.meta_account_id,
      name: metaAdAccounts.name,
    })
    .from(metaAdAccounts)
    .where(and(forUser(userId), inArray(metaAdAccounts.meta_account_id, metaAccountIds)));
}

export async function countMetaAdAccountsForUser(userId: string): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(metaAdAccounts)
    .where(forUser(userId));
  return rows[0]?.value ?? 0;
}

export type SyncMetaAdAccountUpsert = {
  user_id: string;
  workspace_id: string | null;
  meta_account_id: string;
  name: string;
  status: string;
  token_status: string;
  token_expires_at: string | null;
  last_activity_at: string;
  updated_at: string;
};

export async function upsertMetaAdAccountFromSync(row: SyncMetaAdAccountUpsert): Promise<void> {
  const now = row.updated_at;
  await db
    .insert(metaAdAccounts)
    .values({
      user_id: row.user_id,
      workspace_id: row.workspace_id,
      meta_account_id: row.meta_account_id,
      name: row.name,
      status: row.status,
      token_status: row.token_status,
      token_expires_at: row.token_expires_at,
      last_activity_at: row.last_activity_at,
      updated_at: now,
      connected_at: now,
      created_at: now,
      monthly_spend: 0,
      spend_delta_type: "neutral",
      total_ads: 0,
      ads_this_month: 0,
      spend_history: [],
      spend_series_extended: [],
      recent_uploads: [],
    })
    .onConflictDoUpdate({
      target: [metaAdAccounts.user_id, metaAdAccounts.meta_account_id],
      set: {
        workspace_id: row.workspace_id,
        name: row.name,
        status: row.status,
        token_status: row.token_status,
        token_expires_at: row.token_expires_at,
        last_activity_at: row.last_activity_at,
        updated_at: now,
      },
    });
}
