export type CampanhaStatus = "ativa" | "processando" | "concluida" | "pausada" | "erro";

export type CampanhaStructure = "1-50-1" | "1-3-5" | "1-1-5";

export interface CampanhaCreative {
  id: string;
  name: string;
  type: "image" | "video";
  thumb: string;
}

export interface CampanhaError {
  id: string;
  message: string;
  adName: string;
}

export interface Campanha {
  id: string;
  name: string;
  account: string;
  accountId: string;
  structure: CampanhaStructure;
  objective: string;
  dailyBudget: number;
  antiSpy: boolean;
  status: CampanhaStatus;
  adsCreated: number;
  adsTotal: number;
  createdAt: Date;
  /** 7–14 points for sparkline */
  trend: number[];
  creatives: CampanhaCreative[];
  errors?: CampanhaError[];
}

/** Dados reais vêm da API (`/api/campanhas`). */
export const mockCampanhas: Campanha[] = [];

export type CampanhaTabId = "ativas" | "concluidas" | "erro";

export function getCampanhasByStatus(campanhas: Campanha[], status: CampanhaTabId): Campanha[] {
  if (status === "ativas") {
    return campanhas.filter((c) => c.status === "ativa" || c.status === "processando" || c.status === "pausada");
  }
  if (status === "concluidas") return campanhas.filter((c) => c.status === "concluida");
  if (status === "erro") return campanhas.filter((c) => c.status === "erro");
  return campanhas;
}

export function countCampanhasByTab(campanhas: Campanha[]): Record<CampanhaTabId, number> {
  return {
    ativas: getCampanhasByStatus(campanhas, "ativas").length,
    concluidas: getCampanhasByStatus(campanhas, "concluidas").length,
    erro: getCampanhasByStatus(campanhas, "erro").length,
  };
}
