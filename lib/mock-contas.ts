import { differenceInCalendarDays } from "date-fns";

export type ContaStatus = "ativa" | "token_expirado" | "suspensa" | "desconectada" | "reconectando";

export type TokenStatus = "valido" | "expirando" | "expirado";

export type ContaTabId = "todas" | "ativas" | "problema" | "desconectadas";

export interface ContaMeta {
  id: string;
  accountId: string;
  name: string;
  nickname?: string;
  status: ContaStatus;
  tokenStatus: TokenStatus;
  tokenExpiresAt: Date;
  connectedAt: Date;
  lastActivity: Date;
  monthlySpend: number;
  spendDelta: string;
  spendDeltaType: "positive" | "negative" | "neutral";
  totalAds: number;
  adsThisMonth: number;
  approvalRate: number;
  approvalDelta: string;
  defaultBudget: number;
  defaultStructure: string;
  defaultAntiSpy: boolean;
  spendHistory: { day: string; value: number }[];
  /** Longer series for metrics panel (same length labels as spendHistory for simplicity) */
  spendSeriesExtended: { day: string; value: number }[];
  recentUploads: { id: string; date: Date; campaigns: number; status: string }[];
  adsApproved: number;
  adsPending: number;
  adsRejected: number;
  uploadsInPeriod: number;
  uploadsWithError: number;
}

/** Dados reais vêm da API (`/api/contas-meta`). */
export const mockContas: ContaMeta[] = [];

export function contaMatchesTab(conta: ContaMeta, tab: ContaTabId): boolean {
  if (tab === "todas") return true;
  if (tab === "ativas") return conta.status === "ativa";
  if (tab === "desconectadas") return conta.status === "desconectada";
  if (tab === "problema")
    return conta.status === "token_expirado" || conta.status === "suspensa" || conta.status === "reconectando";
  return true;
}

export function tabCounts(contas: ContaMeta[]): Record<ContaTabId, number> {
  return {
    todas: contas.length,
    ativas: contas.filter((c) => contaMatchesTab(c, "ativas")).length,
    problema: contas.filter((c) => contaMatchesTab(c, "problema")).length,
    desconectadas: contas.filter((c) => contaMatchesTab(c, "desconectadas")).length,
  };
}

/** Banner amarelo: token marcado como expirando ou válido mas expira em menos de 7 dias. */
export function hasTokenExpiringSoonBanner(contas: ContaMeta[]): boolean {
  const now = new Date();
  return contas.some((c) => {
    if (c.tokenStatus === "expirando") return true;
    if (c.tokenStatus !== "valido") return false;
    const days = differenceInCalendarDays(c.tokenExpiresAt, now);
    return days >= 0 && days < 7;
  });
}

export type ContaSortId = "recent" | "name" | "spend" | "ads" | "problemFirst";

export type ContaStatusFilterId =
  | "all"
  | "ativa"
  | "token_expirado"
  | "suspensa"
  | "desconectada";
