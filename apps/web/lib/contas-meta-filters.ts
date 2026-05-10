import type { ContaMeta, ContaSortId, ContaStatusFilterId, ContaTabId } from "@/lib/mock-contas";
import { contaMatchesTab } from "@/lib/mock-contas";

export interface ContasPageFiltersState {
  search: string;
  status: ContaStatusFilterId;
  sortBy: ContaSortId;
}

const PROBLEM_ORDER: Record<string, number> = {
  token_expirado: 0,
  suspensa: 1,
  reconectando: 2,
  desconectada: 3,
  ativa: 4,
};

export function filterAndSortContas(
  contas: ContaMeta[],
  tab: ContaTabId,
  { search, status, sortBy }: ContasPageFiltersState
): ContaMeta[] {
  const q = search.trim().toLowerCase();
  let list = contas.filter((c) => contaMatchesTab(c, tab));

  if (status !== "all") {
    list = list.filter((c) => c.status === status);
  }

  if (q) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.accountId.toLowerCase().includes(q) ||
        (c.nickname?.toLowerCase().includes(q) ?? false)
    );
  }

  const sorted = [...list];
  sorted.sort((a, b) => {
    if (sortBy === "problemFirst") {
      const pa = PROBLEM_ORDER[a.status] ?? 9;
      const pb = PROBLEM_ORDER[b.status] ?? 9;
      if (pa !== pb) return pa - pb;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    }
    if (sortBy === "name") return a.name.localeCompare(b.name, "pt-BR");
    if (sortBy === "spend") return b.monthlySpend - a.monthlySpend;
    if (sortBy === "ads") return b.totalAds - a.totalAds;
    /* recent */
    return b.connectedAt.getTime() - a.connectedAt.getTime();
  });

  return sorted;
}

export function hasActiveContasFilters(f: ContasPageFiltersState): boolean {
  return f.search.trim() !== "" || f.status !== "all" || f.sortBy !== "recent";
}

export function defaultContasFilters(): ContasPageFiltersState {
  return { search: "", status: "all", sortBy: "recent" };
}
