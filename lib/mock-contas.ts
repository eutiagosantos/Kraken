import { addDays, differenceInCalendarDays, subDays } from "date-fns";

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

const now = new Date();

function weekSpark(base: number, variance = 0.15): { day: string; value: number }[] {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return days.map((day, i) => ({
    day,
    value: Math.round(base * (1 + (Math.sin(i * 0.8) * variance + (i - 3) * 0.02))),
  }));
}

export const mockContas: ContaMeta[] = [
  {
    id: "CT_001",
    accountId: "ACT_001",
    name: "Loja Exemplo BR",
    status: "ativa",
    tokenStatus: "valido",
    tokenExpiresAt: addDays(now, 72),
    connectedAt: subDays(now, 120),
    lastActivity: now,
    monthlySpend: 12400,
    spendDelta: "+14% vs mês anterior",
    spendDeltaType: "positive",
    totalAds: 1284,
    adsThisMonth: 142,
    approvalRate: 98.2,
    approvalDelta: "+0.4%",
    defaultBudget: 150,
    defaultStructure: "1-50-1",
    defaultAntiSpy: true,
    spendHistory: weekSpark(420),
    spendSeriesExtended: weekSpark(420, 0.2).map((d, i) => ({ ...d, value: d.value + i * 12 })),
    recentUploads: [
      { id: "UP_041", date: subDays(now, 5), campaigns: 142, status: "concluida" },
      { id: "UP_038", date: subDays(now, 18), campaigns: 98, status: "concluida" },
    ],
    adsApproved: 139,
    adsPending: 2,
    adsRejected: 1,
    uploadsInPeriod: 12,
    uploadsWithError: 3,
  },
  {
    id: "CT_002",
    accountId: "ACT_002",
    name: "E-commerce Alpha",
    status: "token_expirado",
    tokenStatus: "expirado",
    tokenExpiresAt: subDays(now, 40),
    connectedAt: subDays(now, 200),
    lastActivity: subDays(now, 40),
    monthlySpend: 8200,
    spendDelta: "-3% vs mês anterior",
    spendDeltaType: "negative",
    totalAds: 876,
    adsThisMonth: 0,
    approvalRate: 96.5,
    approvalDelta: "-1.2%",
    defaultBudget: 80,
    defaultStructure: "1-3-5",
    defaultAntiSpy: true,
    spendHistory: [
      { day: "Seg", value: 210 },
      { day: "Ter", value: 195 },
      { day: "Qua", value: 0 },
      { day: "Qui", value: 0 },
      { day: "Sex", value: 0 },
      { day: "Sáb", value: 0 },
      { day: "Dom", value: 0 },
    ],
    spendSeriesExtended: weekSpark(180, 0.4),
    recentUploads: [],
    adsApproved: 800,
    adsPending: 0,
    adsRejected: 76,
    uploadsInPeriod: 0,
    uploadsWithError: 1,
  },
  {
    id: "CT_003",
    accountId: "ACT_003",
    name: "Agência XYZ",
    nickname: "Cliente Principal",
    status: "ativa",
    tokenStatus: "expirando",
    tokenExpiresAt: addDays(now, 4),
    connectedAt: subDays(now, 300),
    lastActivity: now,
    monthlySpend: 31000,
    spendDelta: "+28% vs mês anterior",
    spendDeltaType: "positive",
    totalAds: 4120,
    adsThisMonth: 487,
    approvalRate: 99.1,
    approvalDelta: "+0.2%",
    defaultBudget: 500,
    defaultStructure: "1-50-1",
    defaultAntiSpy: true,
    spendHistory: weekSpark(1050),
    spendSeriesExtended: weekSpark(1050, 0.12),
    recentUploads: [{ id: "UP_042", date: subDays(now, 1), campaigns: 87, status: "processando" }],
    adsApproved: 4050,
    adsPending: 40,
    adsRejected: 30,
    uploadsInPeriod: 28,
    uploadsWithError: 1,
  },
  {
    id: "CT_004",
    accountId: "ACT_004",
    name: "Performance BR",
    status: "ativa",
    tokenStatus: "valido",
    tokenExpiresAt: addDays(now, 45),
    connectedAt: subDays(now, 60),
    lastActivity: subDays(now, 2),
    monthlySpend: 5600,
    spendDelta: "+2% vs mês anterior",
    spendDeltaType: "positive",
    totalAds: 620,
    adsThisMonth: 44,
    approvalRate: 97.0,
    approvalDelta: "0%",
    defaultBudget: 200,
    defaultStructure: "1-1-5",
    defaultAntiSpy: false,
    spendHistory: weekSpark(280),
    spendSeriesExtended: weekSpark(280),
    recentUploads: [{ id: "UP_039", date: subDays(now, 8), campaigns: 12, status: "concluida" }],
    adsApproved: 600,
    adsPending: 15,
    adsRejected: 5,
    uploadsInPeriod: 6,
    uploadsWithError: 0,
  },
  {
    id: "CT_005",
    accountId: "ACT_005",
    name: "Shop Norte",
    status: "ativa",
    tokenStatus: "valido",
    tokenExpiresAt: addDays(now, 90),
    connectedAt: subDays(now, 14),
    lastActivity: subDays(now, 1),
    monthlySpend: 2100,
    spendDelta: "-8% vs mês anterior",
    spendDeltaType: "negative",
    totalAds: 210,
    adsThisMonth: 18,
    approvalRate: 94.0,
    approvalDelta: "-2%",
    defaultBudget: 50,
    defaultStructure: "1-3-5",
    defaultAntiSpy: true,
    spendHistory: weekSpark(120),
    spendSeriesExtended: weekSpark(120),
    recentUploads: [],
    adsApproved: 198,
    adsPending: 8,
    adsRejected: 4,
    uploadsInPeriod: 3,
    uploadsWithError: 2,
  },
  {
    id: "CT_006",
    accountId: "ACT_006",
    name: "D2C Labs",
    status: "ativa",
    tokenStatus: "valido",
    tokenExpiresAt: addDays(now, 20),
    connectedAt: subDays(now, 400),
    lastActivity: subDays(now, 0),
    monthlySpend: 450,
    spendDelta: "neutro vs mês anterior",
    spendDeltaType: "neutral",
    totalAds: 89,
    adsThisMonth: 3,
    approvalRate: 100,
    approvalDelta: "+0.1%",
    defaultBudget: 30,
    defaultStructure: "Nenhuma",
    defaultAntiSpy: false,
    spendHistory: weekSpark(55),
    spendSeriesExtended: weekSpark(55),
    recentUploads: [{ id: "UP_040", date: subDays(now, 30), campaigns: 3, status: "erro" }],
    adsApproved: 88,
    adsPending: 1,
    adsRejected: 0,
    uploadsInPeriod: 2,
    uploadsWithError: 1,
  },
  {
    id: "CT_007",
    accountId: "ACT_007",
    name: "Brand Suspensa Ltda",
    status: "suspensa",
    tokenStatus: "valido",
    tokenExpiresAt: addDays(now, 10),
    connectedAt: subDays(now, 500),
    lastActivity: subDays(now, 60),
    monthlySpend: 0,
    spendDelta: "-100% vs mês anterior",
    spendDeltaType: "negative",
    totalAds: 400,
    adsThisMonth: 0,
    approvalRate: 88.0,
    approvalDelta: "-5%",
    defaultBudget: 100,
    defaultStructure: "1-50-1",
    defaultAntiSpy: true,
    spendHistory: weekSpark(0),
    spendSeriesExtended: weekSpark(0),
    recentUploads: [{ id: "UP_030", date: subDays(now, 90), campaigns: 50, status: "concluida" }],
    adsApproved: 350,
    adsPending: 0,
    adsRejected: 50,
    uploadsInPeriod: 0,
    uploadsWithError: 0,
  },
  {
    id: "CT_008",
    accountId: "ACT_008",
    name: "Legacy Store",
    status: "desconectada",
    tokenStatus: "expirado",
    tokenExpiresAt: subDays(now, 200),
    connectedAt: subDays(now, 700),
    lastActivity: subDays(now, 200),
    monthlySpend: 0,
    spendDelta: "—",
    spendDeltaType: "neutral",
    totalAds: 120,
    adsThisMonth: 0,
    approvalRate: 92.0,
    approvalDelta: "—",
    defaultBudget: 40,
    defaultStructure: "1-3-5",
    defaultAntiSpy: false,
    spendHistory: weekSpark(0),
    spendSeriesExtended: weekSpark(0),
    recentUploads: [],
    adsApproved: 110,
    adsPending: 0,
    adsRejected: 10,
    uploadsInPeriod: 0,
    uploadsWithError: 0,
  },
];

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
