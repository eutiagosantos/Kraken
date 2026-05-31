/**
 * Short TTL in-memory cache keyed by `user_id` for dashboard / contas list.
 * Stores Supabase rows so date formatting (e.g. formatDistanceToNow) stays fresh on each response.
 */

import type { Database } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];

export type HomeDashboardRows = {
  kpis: Tables["home_kpis"]["Row"][];
  uploads: Tables["upload_jobs"]["Row"][];
  activities: Tables["activity_events"]["Row"][];
  creatives: Tables["creative_library_items"]["Row"][];
};

export type ContasMetaListRows = Tables["meta_ad_accounts"]["Row"][];

const HOME_DASHBOARD_TTL_MS = 12_000;
const CONTAS_META_LIST_TTL_MS = 10_000;

const homeDashboardRowsByUser = new Map<string, { expiresAt: number; rows: HomeDashboardRows }>();
const contasMetaRowsByUser = new Map<string, { expiresAt: number; rows: ContasMetaListRows }>();

export function getCachedHomeDashboardRows(userId: string): HomeDashboardRows | null {
  const row = homeDashboardRowsByUser.get(userId);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    homeDashboardRowsByUser.delete(userId);
    return null;
  }
  return row.rows;
}

export function setCachedHomeDashboardRows(userId: string, rows: HomeDashboardRows): void {
  homeDashboardRowsByUser.set(userId, { rows, expiresAt: Date.now() + HOME_DASHBOARD_TTL_MS });
}

export function getCachedContasMetaRows(userId: string): ContasMetaListRows | null {
  const row = contasMetaRowsByUser.get(userId);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    contasMetaRowsByUser.delete(userId);
    return null;
  }
  return row.rows;
}

export function setCachedContasMetaRows(userId: string, rows: ContasMetaListRows): void {
  contasMetaRowsByUser.set(userId, { rows, expiresAt: Date.now() + CONTAS_META_LIST_TTL_MS });
}

export function invalidateUserDataShortCache(userId: string): void {
  homeDashboardRowsByUser.delete(userId);
  contasMetaRowsByUser.delete(userId);
}
