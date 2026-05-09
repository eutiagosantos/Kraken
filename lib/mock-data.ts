export type AccountStatus = "ativo" | "suspenso";

export type MockAccount = {
  id: string;
  name: string;
  status: AccountStatus;
  spend: string;
};

export const mockAccounts: MockAccount[] = [
  { id: "ACT_001", name: "Loja Exemplo BR", status: "ativo", spend: "R$ 12.400" },
  { id: "ACT_002", name: "E-commerce Alpha", status: "ativo", spend: "R$ 8.200" },
  { id: "ACT_003", name: "Agência XYZ", status: "ativo", spend: "R$ 31.000" },
  { id: "ACT_004", name: "Conta Suspensa", status: "suspenso", spend: "R$ 0" },
];

export type StatDeltaType = "positive" | "neutral" | "negative";

export type MockStat = {
  label: string;
  value: string;
  delta: string;
  deltaType: StatDeltaType;
  icon: "zap" | "users" | "upload" | "checkCircle";
  iconBg: string;
  iconColor: string;
};

export const mockStats: MockStat[] = [
  {
    label: "Anúncios Criados",
    value: "12.847",
    delta: "+342 hoje",
    deltaType: "positive",
    icon: "zap",
    iconBg: "rgba(113,50,245,0.12)",
    iconColor: "#7132f5",
  },
  {
    label: "Contas Ativas",
    value: "8",
    delta: "+1 esta semana",
    deltaType: "positive",
    icon: "users",
    iconBg: "rgba(20,158,97,0.12)",
    iconColor: "#149e61",
  },
  {
    label: "Uploads Este Mês",
    value: "47",
    delta: "3 em andamento",
    deltaType: "neutral",
    icon: "upload",
    iconBg: "rgba(113,50,245,0.12)",
    iconColor: "#7132f5",
  },
  {
    label: "Taxa de Aprovação",
    value: "98.2%",
    delta: "+0.4% vs mês anterior",
    deltaType: "positive",
    icon: "checkCircle",
    iconBg: "rgba(20,158,97,0.12)",
    iconColor: "#149e61",
  },
];

export type ActivityType = "success" | "processing" | "error";

export type MockActivity = {
  type: ActivityType;
  message: string;
  account: string;
  time: string;
};

export const mockActivities: MockActivity[] = [
  {
    type: "success",
    message: "Upload concluído — 142 campanhas criadas",
    account: "Loja Exemplo BR",
    time: "há 12 min",
  },
  {
    type: "processing",
    message: "Upload em andamento — 87/200 campanhas",
    account: "Agência XYZ",
    time: "há 35 min",
  },
  {
    type: "error",
    message: "3 anúncios rejeitados — revisar criativos",
    account: "E-commerce Alpha",
    time: "há 2h",
  },
  {
    type: "success",
    message: "Nova conta conectada com sucesso",
    account: "Sistema",
    time: "há 3h",
  },
  {
    type: "success",
    message: "Upload concluído — 56 campanhas criadas",
    account: "E-commerce Alpha",
    time: "ontem",
  },
];

export type UploadJobStatus = "processing" | "completed" | "error";

export type MockActiveUpload = {
  id: string;
  account: string;
  total: number;
  done: number;
  status: UploadJobStatus;
  startedAt: string;
};

export const mockActiveUploads: MockActiveUpload[] = [
  {
    id: "UP_001",
    account: "Agência XYZ",
    total: 200,
    done: 87,
    status: "processing",
    startedAt: "14:23",
  },
  {
    id: "UP_002",
    account: "Loja Exemplo BR",
    total: 50,
    done: 50,
    status: "completed",
    startedAt: "13:10",
  },
];

export type QuickActionKey = "upload" | "connect" | "duplicate" | "report";

export type MockQuickActionMeta = {
  key: QuickActionKey;
  label: string;
  description: string;
  color: string;
  bg: string;
  href?: string;
};

export const mockQuickActionsMeta: MockQuickActionMeta[] = [
  {
    key: "upload",
    label: "Novo Upload",
    description: "Iniciar upload em massa",
    color: "#7132f5",
    bg: "rgba(113,50,245,0.08)",
  },
  {
    key: "connect",
    label: "Conectar Conta",
    description: "Adicionar conta Meta Ads",
    color: "#149e61",
    bg: "rgba(20,158,97,0.08)",
    href: "/contas",
  },
  {
    key: "duplicate",
    label: "Duplicar Upload",
    description: "Reutilizar configuração anterior",
    color: "#5741d8",
    bg: "rgba(87,65,216,0.08)",
  },
  {
    key: "report",
    label: "Ver Relatório",
    description: "Analisar desempenho",
    color: "#d97706",
    bg: "rgba(217,119,6,0.08)",
    href: "/relatorios",
  },
];

export type MetricsChartPoint = {
  name: string;
  uploads: number;
  spend: number;
};

export const mockMetricsSeries: MetricsChartPoint[] = [
  { name: "Seg", uploads: 12, spend: 4200 },
  { name: "Ter", uploads: 18, spend: 5100 },
  { name: "Qua", uploads: 15, spend: 4800 },
  { name: "Qui", uploads: 22, spend: 6200 },
  { name: "Sex", uploads: 28, spend: 7100 },
  { name: "Sáb", uploads: 9, spend: 3100 },
  { name: "Dom", uploads: 11, spend: 3600 },
];

export type WizardConfig = {
  campaignName: string;
  objective: string;
  dailyBudget: string;
  structure: string;
  antiSpy: boolean;
};

export const campaignObjectives = ["Conversões", "Tráfego", "Alcance", "Reconhecimento"] as const;

export const structureOptions = ["1-50-1", "1-3-5", "1-1-5", "Personalizada"] as const;

export const initialWizardState = {
  step: 1,
  selectedAccounts: [] as string[],
  config: {
    campaignName: "",
    objective: "Conversões",
    dailyBudget: "",
    structure: "1-50-1",
    antiSpy: true,
  } satisfies WizardConfig,
};

export const mockUser = {
  name: "João Silva",
  email: "joao@empresa.com.br",
};
