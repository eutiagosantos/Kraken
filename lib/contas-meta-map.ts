import type { ContaMeta, ContaStatus, TokenStatus } from "@/lib/mock-contas";
import type { Database } from "@/lib/supabase/types";

type MetaAdAccountRow = Database["public"]["Tables"]["meta_ad_accounts"]["Row"];

const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

function defaultWeek(): { day: string; value: number }[] {
  return WEEK_DAYS.map((day) => ({ day, value: 0 }));
}

function parseWeekJson(json: unknown): { day: string; value: number }[] {
  if (!Array.isArray(json)) return defaultWeek();
  const out: { day: string; value: number }[] = [];
  for (const item of json) {
    if (item && typeof item === "object" && "day" in item && "value" in item) {
      const o = item as { day: unknown; value: unknown };
      out.push({ day: String(o.day), value: Number(o.value) || 0 });
    }
  }
  return out.length ? out : defaultWeek();
}

function parseRecentUploads(json: unknown): ContaMeta["recentUploads"] {
  if (!Array.isArray(json)) return [];
  return json
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as { id?: unknown; date?: unknown; campaigns?: unknown; status?: unknown };
      const id = String(o.id ?? "");
      const dateRaw = o.date;
      const date =
        typeof dateRaw === "string" || typeof dateRaw === "number"
          ? new Date(dateRaw)
          : dateRaw instanceof Date
            ? dateRaw
            : new Date();
      return {
        id,
        date,
        campaigns: Number(o.campaigns) || 0,
        status: String(o.status ?? ""),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null && x.id.length > 0);
}

function coerceContaStatus(s: string): ContaStatus {
  if (s === "ativa" || s === "token_expirado" || s === "suspensa" || s === "desconectada" || s === "reconectando") {
    return s;
  }
  return "ativa";
}

function deriveTokenStatus(row: MetaAdAccountRow): TokenStatus {
  const raw = row.token_status as TokenStatus;
  if (raw === "valido" || raw === "expirando" || raw === "expirado") return raw;
  if (!row.token_expires_at) return "valido";
  const exp = new Date(row.token_expires_at);
  const days = Math.ceil((exp.getTime() - Date.now()) / (86400 * 1000));
  if (days < 0) return "expirado";
  if (days < 7) return "expirando";
  return "valido";
}

export function rowToContaMeta(row: MetaAdAccountRow): ContaMeta {
  const accountId = row.meta_account_id.replace(/^act_/i, "");
  const spendDeltaType =
    row.spend_delta_type === "positive" || row.spend_delta_type === "negative" || row.spend_delta_type === "neutral"
      ? row.spend_delta_type
      : "neutral";

  return {
    id: row.id,
    accountId,
    name: row.name,
    nickname: row.nickname ?? undefined,
    status: coerceContaStatus(row.status),
    tokenStatus: deriveTokenStatus(row),
    tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at) : new Date(Date.now() + 86400 * 60 * 1000),
    connectedAt: new Date(row.connected_at),
    lastActivity: row.last_activity_at ? new Date(row.last_activity_at) : new Date(row.connected_at),
    monthlySpend: Number(row.monthly_spend) || 0,
    spendDelta: row.spend_delta ?? "—",
    spendDeltaType,
    totalAds: row.total_ads ?? 0,
    adsThisMonth: row.ads_this_month ?? 0,
    approvalRate: row.approval_rate ?? 0,
    approvalDelta: row.approval_delta ?? "—",
    defaultBudget: row.default_budget ?? 0,
    defaultStructure: row.default_structure ?? "1-50-1",
    defaultAntiSpy: row.default_anti_spy ?? true,
    spendHistory: parseWeekJson(row.spend_history),
    spendSeriesExtended: parseWeekJson(row.spend_series_extended),
    recentUploads: parseRecentUploads(row.recent_uploads),
    adsApproved: row.ads_approved ?? 0,
    adsPending: row.ads_pending ?? 0,
    adsRejected: row.ads_rejected ?? 0,
    uploadsInPeriod: row.uploads_in_period ?? 0,
    uploadsWithError: row.uploads_with_error ?? 0,
  };
}
