export type CampanhaStatus = "ativa" | "processando" | "concluida" | "pausada" | "erro";

import type { CampanhaStructurePreset } from "@/lib/campanhas-structure";

export type { CampanhaStructurePreset };

/** Display label shown in table/detail (preset or custom counts). */
export type CampanhaStructure = CampanhaStructurePreset | (string & {});

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
