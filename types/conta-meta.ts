export type ContaMetaStatus = "ativa" | "token_expirado" | "suspensa" | "desconectada" | "reconectando";

export interface ContaMeta {
  id: string;
  accountId: string;
  name: string;
  status: ContaMetaStatus;
}
