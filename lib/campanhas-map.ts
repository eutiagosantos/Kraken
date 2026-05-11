import type { Campanha, CampanhaCreative, CampanhaError, CampanhaStructure, CampanhaStatus } from "@/lib/mock-campanhas";
import type { Database, Json } from "@/lib/supabase/types";

type CampanhaRow = Database["public"]["Tables"]["campanhas"]["Row"];

function coerceStructure(s: string): CampanhaStructure {
  if (s === "1-50-1" || s === "1-3-5" || s === "1-1-5") return s;
  return "1-50-1";
}

function coerceStatus(s: string): CampanhaStatus {
  if (s === "ativa" || s === "processando" || s === "concluida" || s === "pausada" || s === "erro") return s;
  return "ativa";
}

function parseTrend(json: unknown): number[] {
  if (!Array.isArray(json)) return [];
  return json.map((n) => (typeof n === "number" ? n : Number(n) || 0));
}

function parseCreatives(json: unknown): CampanhaCreative[] {
  if (!Array.isArray(json)) return [];
  const out: CampanhaCreative[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    out.push({
      id: String(o.id ?? ""),
      name: String(o.name ?? ""),
      type: o.type === "video" ? "video" : "image",
      thumb: String(o.thumb ?? ""),
    });
  }
  return out.filter((c) => c.id);
}

function parseErrors(json: unknown): CampanhaError[] | undefined {
  if (!json || !Array.isArray(json)) return undefined;
  const out: CampanhaError[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    out.push({
      id: String(o.id ?? ""),
      message: String(o.message ?? ""),
      adName: String(o.adName ?? ""),
    });
  }
  return out.length ? out : undefined;
}

export function rowToCampanha(row: CampanhaRow): Campanha {
  return {
    id: row.id,
    name: row.name,
    account: row.account_name,
    accountId: row.account_meta_id,
    structure: coerceStructure(row.structure),
    objective: row.objective,
    dailyBudget: Number(row.daily_budget) || 0,
    antiSpy: row.anti_spy,
    status: coerceStatus(row.status),
    adsCreated: row.ads_created,
    adsTotal: row.ads_total,
    createdAt: new Date(row.created_at),
    trend: parseTrend(row.trend),
    creatives: parseCreatives(row.creatives),
    errors: parseErrors(row.errors),
  };
}

export function campanhaToInsert(
  userId: string,
  c: Omit<Campanha, "id" | "createdAt"> & { workspaceId?: string | null }
): Database["public"]["Tables"]["campanhas"]["Insert"] {
  return {
    user_id: userId,
    workspace_id: c.workspaceId ?? null,
    name: c.name,
    account_name: c.account,
    account_meta_id: c.accountId,
    structure: c.structure,
    objective: c.objective,
    daily_budget: c.dailyBudget,
    anti_spy: c.antiSpy,
    status: c.status,
    ads_created: c.adsCreated,
    ads_total: c.adsTotal,
    trend: c.trend as unknown as Json,
    creatives: c.creatives as unknown as Json,
    errors: (c.errors ?? null) as Json | null,
  };
}
