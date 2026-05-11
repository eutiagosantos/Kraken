export type AccountStatus = "ativo" | "suspenso";

export type MockAccount = {
  id: string;
  name: string;
  /** Apelido local (Kraken); opcional. */
  nickname?: string | null;
  status: AccountStatus;
  spend: string;
};

export const mockAccounts: MockAccount[] = [];

export type StatDeltaType = "positive" | "neutral" | "negative";

export type MockStat = {
  label: string;
  value: string;
  delta: string;
  deltaType: StatDeltaType;
  iconColor: string;
};

export const mockStats: MockStat[] = [];

export const mockHomeCreativesCampaignStats: MockStat[] = [];

export type ActivityType = "success" | "processing" | "error";

export type MockActivity = {
  id?: string;
  type: ActivityType;
  message: string;
  account: string;
  time: string;
};

export const mockActivities: MockActivity[] = [];

export const mockHomeActivities: MockActivity[] = [];

export type UploadJobStatus = "processing" | "completed" | "error";

export type MockActiveUpload = {
  id: string;
  account: string;
  total: number;
  done: number;
  status: UploadJobStatus;
  startedAt: string;
};

export const mockActiveUploads: MockActiveUpload[] = [];

export type CreativeLibraryStatus = "aprovado" | "pendente" | "rejeitado";

export type MockCreativeLibraryItem = {
  id: string;
  name: string;
  format: string;
  status: CreativeLibraryStatus;
  campaignsCount: number;
};

export const mockCreativeLibraryItems: MockCreativeLibraryItem[] = [];

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
    bg: "rgba(133, 91, 251, 0.16)",
  },
  {
    key: "connect",
    label: "Conectar Conta",
    description: "Adicionar conta Meta Ads",
    color: "#149e61",
    bg: "rgba(20, 158, 97, 0.16)",
    href: "/contas-meta",
  },
  {
    key: "duplicate",
    label: "Duplicar Upload",
    description: "Reutilizar configuração anterior",
    color: "#5741d8",
    bg: "rgba(87, 65, 216, 0.14)",
  },
  {
    key: "report",
    label: "Ver Relatório",
    description: "Analisar desempenho",
    color: "#d97706",
    bg: "rgba(217, 119, 6, 0.14)",
    href: "/relatorios",
  },
];

export type MetricsChartPoint = {
  name: string;
  uploads: number;
  spend: number;
};

export const mockMetricsSeries: MetricsChartPoint[] = [
  { name: "Seg", uploads: 0, spend: 0 },
  { name: "Ter", uploads: 0, spend: 0 },
  { name: "Qua", uploads: 0, spend: 0 },
  { name: "Qui", uploads: 0, spend: 0 },
  { name: "Sex", uploads: 0, spend: 0 },
  { name: "Sáb", uploads: 0, spend: 0 },
  { name: "Dom", uploads: 0, spend: 0 },
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
  name: "",
  email: "",
};

export type MockWorkspace = {
  id: string;
  name: string;
  plan: string;
  membersLabel?: string;
};

export const mockWorkspaces: MockWorkspace[] = [];
