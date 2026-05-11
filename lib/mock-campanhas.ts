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

const thumb = (seed: number) => `https://picsum.photos/seed/da${seed}/120/120`;

const mkCreatives = (prefix: string, count: number): CampanhaCreative[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}_cr_${i + 1}`,
    name: `Criativo ${i + 1} — ${prefix}`,
    type: i % 3 === 0 ? ("video" as const) : ("image" as const),
    thumb: thumb(seedFrom(prefix) + i),
  }));

function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 900 + 1;
}

const trend = (base: number, len = 10): number[] =>
  Array.from({ length: len }, (_, i) => Math.max(0, Math.round(base + Math.sin(i * 0.7) * 8 + i * 3)));

export const mockCampanhas: Campanha[] = [
  {
    id: "CP_8841",
    name: "Black Friday 2024 - Conversões",
    account: "Loja Exemplo BR",
    accountId: "ACT_001",
    structure: "1-50-1",
    objective: "Conversões",
    dailyBudget: 150,
    antiSpy: true,
    status: "ativa",
    adsCreated: 142,
    adsTotal: 142,
    createdAt: new Date("2026-05-08T14:23:00"),
    trend: trend(40),
    creatives: mkCreatives("8841", 6),
  },
  {
    id: "CP_8842",
    name: "Prospecção - Novembro",
    account: "Agência XYZ",
    accountId: "ACT_003",
    structure: "1-3-5",
    objective: "Tráfego",
    dailyBudget: 80,
    antiSpy: true,
    status: "processando",
    adsCreated: 87,
    adsTotal: 200,
    createdAt: new Date("2026-05-08T13:10:00"),
    trend: trend(22),
    creatives: mkCreatives("8842", 5),
  },
  {
    id: "CP_8843",
    name: "Remarketing Carrinho",
    account: "E-commerce Alpha",
    accountId: "ACT_002",
    structure: "1-1-5",
    objective: "Vendas",
    dailyBudget: 220,
    antiSpy: false,
    status: "ativa",
    adsCreated: 48,
    adsTotal: 60,
    createdAt: new Date("2026-05-07T09:45:00"),
    trend: trend(55),
    creatives: mkCreatives("8843", 4),
  },
  {
    id: "CP_8844",
    name: "Lançamento Coleção Inverno",
    account: "Loja Exemplo BR",
    accountId: "ACT_001",
    structure: "1-3-5",
    objective: "Tráfego",
    dailyBudget: 95,
    antiSpy: true,
    status: "pausada",
    adsCreated: 120,
    adsTotal: 120,
    createdAt: new Date("2026-05-04T16:00:00"),
    trend: trend(30),
    creatives: mkCreatives("8844", 3),
  },
  {
    id: "CP_8845",
    name: "App Installs — Android",
    account: "Agência XYZ",
    accountId: "ACT_003",
    structure: "1-50-1",
    objective: "Instalações",
    dailyBudget: 300,
    antiSpy: true,
    status: "processando",
    adsCreated: 12,
    adsTotal: 150,
    createdAt: new Date("2026-05-09T08:12:00"),
    trend: trend(10),
    creatives: mkCreatives("8845", 8),
  },
  {
    id: "CP_8846",
    name: "Stories — Teste A/B",
    account: "E-commerce Alpha",
    accountId: "ACT_002",
    structure: "1-1-5",
    objective: "Engajamento",
    dailyBudget: 45,
    antiSpy: false,
    status: "ativa",
    adsCreated: 24,
    adsTotal: 24,
    createdAt: new Date("2026-05-06T11:30:00"),
    trend: trend(18),
    creatives: mkCreatives("8846", 2),
  },
  {
    id: "CP_8847",
    name: "Campanha Lead Gen B2B",
    account: "Loja Exemplo BR",
    accountId: "ACT_001",
    structure: "1-3-5",
    objective: "Leads",
    dailyBudget: 200,
    antiSpy: true,
    status: "concluida",
    adsCreated: 90,
    adsTotal: 90,
    createdAt: new Date("2026-04-20T10:00:00"),
    trend: trend(70),
    creatives: mkCreatives("8847", 5),
  },
  {
    id: "CP_8848",
    name: "Vídeo Views 15s",
    account: "Agência XYZ",
    accountId: "ACT_003",
    structure: "1-50-1",
    objective: "Visualizações",
    dailyBudget: 60,
    antiSpy: true,
    status: "concluida",
    adsCreated: 200,
    adsTotal: 200,
    createdAt: new Date("2026-04-12T14:20:00"),
    trend: trend(85),
    creatives: mkCreatives("8848", 7),
  },
  {
    id: "CP_8849",
    name: "Catálogo Dinâmico Q4",
    account: "E-commerce Alpha",
    accountId: "ACT_002",
    structure: "1-50-1",
    objective: "Vendas",
    dailyBudget: 400,
    antiSpy: true,
    status: "concluida",
    adsCreated: 500,
    adsTotal: 500,
    createdAt: new Date("2026-03-01T09:00:00"),
    trend: trend(95),
    creatives: mkCreatives("8849", 9),
  },
  {
    id: "CP_8850",
    name: "Upload com falha parcial",
    account: "Loja Exemplo BR",
    accountId: "ACT_001",
    structure: "1-1-5",
    objective: "Conversões",
    dailyBudget: 120,
    antiSpy: true,
    status: "erro",
    adsCreated: 15,
    adsTotal: 40,
    createdAt: new Date("2026-05-09T18:40:00"),
    trend: trend(12),
    creatives: mkCreatives("8850", 3),
    errors: [
      { id: "e1", message: "Creative rejeitado pela política de texto.", adName: "Anúncio 3 — Headline" },
      { id: "e2", message: "URL de destino inválida.", adName: "Anúncio 7 — Link" },
    ],
  },
  {
    id: "CP_8851",
    name: "Pausada — orçamento",
    account: "Agência XYZ",
    accountId: "ACT_003",
    structure: "1-3-5",
    objective: "Tráfego",
    dailyBudget: 50,
    antiSpy: false,
    status: "pausada",
    adsCreated: 60,
    adsTotal: 60,
    createdAt: new Date("2026-05-02T12:00:00"),
    trend: trend(25),
    creatives: mkCreatives("8851", 4),
  },
  {
    id: "CP_8852",
    name: "Conversões Lookalike 1%",
    account: "E-commerce Alpha",
    accountId: "ACT_002",
    structure: "1-50-1",
    objective: "Conversões",
    dailyBudget: 180,
    antiSpy: true,
    status: "concluida",
    adsCreated: 75,
    adsTotal: 75,
    createdAt: new Date("2026-03-28T08:30:00"),
    trend: trend(62),
    creatives: mkCreatives("8852", 5),
  },
  {
    id: "CP_8853",
    name: "Erro de permissão BM",
    account: "E-commerce Alpha",
    accountId: "ACT_002",
    structure: "1-3-5",
    objective: "Leads",
    dailyBudget: 100,
    antiSpy: true,
    status: "erro",
    adsCreated: 0,
    adsTotal: 30,
    createdAt: new Date("2026-05-09T07:15:00"),
    trend: trend(5),
    creatives: [],
    errors: [{ id: "e3", message: "Conta sem permissão para criar campanhas neste BM.", adName: "—" }],
  },
];

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
