import type { NomenclatureToken, Publico } from "@/lib/stores/wizardStore";

export type WizardPixel = {
  id: string;
  name: string;
};

export type WizardPreset = {
  id: string;
  name: string;
  tokens: NomenclatureToken[];
};

export type WizardLocationOption = {
  value: string;
  label: string;
  type: "country" | "state" | "city";
};

export type WizardInterestOption = {
  value: string;
  label: string;
};

export const mockPixels: WizardPixel[] = [
  { id: "44082631820300", name: "Pixel Principal" },
  { id: "98732100293847", name: "Pixel E-commerce" },
];

export const mockSavedPresets: WizardPreset[] = [
  {
    id: "p1",
    name: "Padrão Agência",
    tokens: [
      { type: "variable", value: "{{conta_nome}}", label: "Conta (Nome)", color: "#7132f5" },
      { type: "text", value: "_" },
      { type: "variable", value: "{{objetivo}}", label: "Objetivo", color: "#d97706" },
      { type: "text", value: "_" },
      { type: "variable", value: "{{criativo}}", label: "Criativo", color: "#149e61" },
      { type: "text", value: "_" },
      { type: "variable", value: "{{seq}}", label: "Sequencial", color: "#0ea5e9" },
    ],
  },
  {
    id: "p2",
    name: "Black Friday",
    tokens: [
      { type: "text", value: "BF_" },
      { type: "variable", value: "{{data_dd_mm_aa_}}", label: "Data BR", color: "#e879f9" },
      { type: "text", value: "_" },
      { type: "variable", value: "{{budget}}", label: "Budget", color: "#d97706" },
    ],
  },
];

export const mockSavedPublicos: Publico[] = [
  {
    id: "pub1",
    name: "Brasil 25-45",
    type: "saved",
    locations: [{ type: "country", key: "BR", name: "Brasil" }],
    ageMin: 25,
    ageMax: 45,
    gender: "all",
    interests: [],
    devices: ["mobile"],
    platforms: ["facebook", "instagram"],
  },
  {
    id: "pub2",
    name: "SP + RJ Masculino",
    type: "saved",
    locations: [
      { type: "state", key: "BR-SP", name: "São Paulo" },
      { type: "state", key: "BR-RJ", name: "Rio de Janeiro" },
    ],
    ageMin: 18,
    ageMax: 35,
    gender: "male",
    interests: [{ id: "6003139266461", name: "Fitness e musculação" }],
    devices: ["mobile"],
    platforms: ["instagram"],
  },
];

export const mockLocationOptions: WizardLocationOption[] = [
  { value: "BR", label: "Brasil", type: "country" },
  { value: "US", label: "Estados Unidos", type: "country" },
  { value: "PT", label: "Portugal", type: "country" },
  { value: "BR-SP", label: "São Paulo (Estado)", type: "state" },
  { value: "BR-RJ", label: "Rio de Janeiro (Estado)", type: "state" },
  { value: "BR-SP-SAO", label: "São Paulo (Cidade)", type: "city" },
];

export const mockInterestOptions: WizardInterestOption[] = [
  { value: "6003139266461", label: "Fitness e musculação" },
  { value: "6003020834693", label: "Compras online" },
  { value: "6003139266464", label: "Empreendedorismo" },
  { value: "6003412345678", label: "Moda feminina" },
  { value: "6003412300123", label: "Tecnologia e gadgets" },
];
