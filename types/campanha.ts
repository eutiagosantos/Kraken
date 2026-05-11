export type CampanhaStatus = "ativa" | "processando" | "concluida" | "pausada" | "erro";

export interface Campanha {
  id: string;
  name: string;
  status: CampanhaStatus;
}
