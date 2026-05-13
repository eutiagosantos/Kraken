"use client";

import { create } from "zustand";

import {
  defaultBillingEventForOptimizationGoal,
  validBillingEventsForOptimizationGoal,
  type WizardAdSetBillingEvent,
} from "@/lib/meta/billing-event";
import { selectOptimizationForObjective } from "@/lib/meta/map-wizard-to-graph";
import { defaultCampaignSchedule, type CampaignSchedule } from "@/lib/meta/campaign-schedule";

function initialAdSetBillingChoice(objective: string, pixelId: string): WizardAdSetBillingEvent | null {
  const g = selectOptimizationForObjective(objective, pixelId).optimization_goal;
  const v = validBillingEventsForOptimizationGoal(g);
  if (v.length <= 1) return null;
  return defaultBillingEventForOptimizationGoal(g) as WizardAdSetBillingEvent;
}

export interface Creative {
  id: string;
  file: File;
  name: string;
  type: "image" | "video";
  preview: string;
  size: number;
  /** Primary ad text for Meta; empty → publish falls back to `name` (filename). */
  primaryText: string;
}

export type CreativeDraft = Omit<Creative, "primaryText"> & { primaryText?: string };

export interface Localidade {
  type: "country" | "state" | "region" | "city";
  key: string;
  name: string;
}

export interface PublicoInterest {
  id: string;
  name: string;
}

export interface Publico {
  id: string;
  name: string;
  type: "saved" | "custom";
  locations: Localidade[];
  ageMin: number;
  ageMax: number;
  gender: "all" | "male" | "female";
  interests: PublicoInterest[];
  devices: ("mobile" | "desktop")[];
  platforms: ("facebook" | "instagram" | "audience_network" | "messenger")[];
}

export interface NomenclatureToken {
  type: "variable" | "text";
  value: string;
  label?: string;
  color?: string;
}

export type CampaignType = "CBO" | "ABO" | "DPA";
export type BidStrategy = "LOWEST_COST" | "BID_CAP" | "COST_CAP" | "ROAS";
export type BudgetPeriod = "daily" | "lifetime";
export type WizardStatus = "ACTIVE" | "PAUSED";
export type Structure = "1-1-1" | "1-3-5" | "1-50-1" | "custom";

const defaultPublico: Publico = {
  id: "default",
  name: "Público padrão",
  type: "custom",
  locations: [],
  ageMin: 18,
  ageMax: 65,
  gender: "all",
  interests: [],
  devices: ["mobile", "desktop"],
  platforms: ["facebook", "instagram"],
};

const initialState = {
  step: 1 as 1 | 2 | 3,
  creatives: [] as Creative[],
  selectedAccountIds: [] as string[],
  campaignType: "CBO" as CampaignType,
  budget: 50,
  budgetPeriod: "daily" as BudgetPeriod,
  bidStrategy: "LOWEST_COST" as BidStrategy,
  bidLimit: undefined as number | undefined,
  roasTarget: undefined as number | undefined,
  objective: "OUTCOME_SALES",
  pixelId: "",
  /** When null, publish uses default billing for the derived optimization_goal. */
  adSetBillingEvent: initialAdSetBillingChoice("OUTCOME_SALES", ""),
  status: "ACTIVE" as WizardStatus,
  structure: "1-1-1" as Structure,
  customStructure: { campaigns: 1, adsets: 1, ads: 1 },
  nomenclatureTokens: [] as NomenclatureToken[],
  nomenclaturePreview: "",
  publico: defaultPublico,
  /** Facebook Page ID for ad creatives — chosen in step 1 after accounts are selected. */
  pageId: null as string | null,
  campaignSchedule: defaultCampaignSchedule(),
  /** When `"wizard"`, the fila page should run `publishCampaigns` once (consumed synchronously). */
  publishJobTrigger: null as null | "wizard",
  /** In-flight publish UI (survives React Strict Mode remounts on the fila page). */
  queuePublish: {
    active: false,
    progress: 0,
    error: null as string | null,
    success: false,
  },
};

export type WizardQueuePublish = (typeof initialState)["queuePublish"];

type WizardState = typeof initialState & {
  setStep: (step: 1 | 2 | 3) => void;
  addCreative: (creative: CreativeDraft) => void;
  updateCreative: (id: string, patch: Partial<Pick<Creative, "primaryText">>) => void;
  removeCreative: (id: string) => void;
  toggleAccount: (id: string) => void;
  setSelectedAccountIds: (ids: string[]) => void;
  setCampaignType: (type: CampaignType) => void;
  setBudget: (value: number) => void;
  setBudgetPeriod: (value: BudgetPeriod) => void;
  setBidStrategy: (strategy: BidStrategy) => void;
  setBidLimit: (value: number | undefined) => void;
  setRoasTarget: (value: number | undefined) => void;
  setObjective: (value: string) => void;
  setPixelId: (value: string) => void;
  setAdSetBillingEvent: (value: WizardAdSetBillingEvent | null) => void;
  setStatus: (value: WizardStatus) => void;
  setStructure: (value: Structure) => void;
  setCustomStructure: (value: Partial<{ campaigns: number; adsets: number; ads: number }>) => void;
  setNomenclatureTokens: (tokens: NomenclatureToken[]) => void;
  setNomenclaturePreview: (value: string) => void;
  setPublico: (publico: Partial<Publico>) => void;
  setPageId: (pageId: string | null) => void;
  setCampaignSchedule: (patch: Partial<CampaignSchedule>) => void;
  resetCreatives: () => void;
  reset: () => void;
  requestPublishJob: () => void;
  /** Returns `"wizard"` if a job was pending and was cleared; otherwise `null`. */
  consumePublishJobTrigger: () => null | "wizard";
  patchQueuePublish: (partial: Partial<WizardQueuePublish>) => void;
};

const initialQueuePublish: WizardQueuePublish = {
  active: false,
  progress: 0,
  error: null,
  success: false,
};

export const useWizardStore = create<WizardState>()((set, get) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  addCreative: (creative) =>
    set((s) => ({
      creatives: [...s.creatives, { ...creative, primaryText: creative.primaryText ?? "" }],
    })),
  updateCreative: (id, patch) =>
    set((s) => ({
      creatives: s.creatives.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  removeCreative: (id) =>
    set((s) => ({
      creatives: s.creatives.filter((c) => c.id !== id),
    })),
  toggleAccount: (id) =>
    set((s) => ({
      selectedAccountIds: s.selectedAccountIds.includes(id)
        ? s.selectedAccountIds.filter((a) => a !== id)
        : [...s.selectedAccountIds, id],
    })),
  setSelectedAccountIds: (selectedAccountIds) => set({ selectedAccountIds }),
  setCampaignType: (campaignType) => set({ campaignType }),
  setBudget: (budget) => set({ budget }),
  setBudgetPeriod: (budgetPeriod) => set({ budgetPeriod }),
  setBidStrategy: (bidStrategy) => set({ bidStrategy }),
  setBidLimit: (bidLimit) => set({ bidLimit }),
  setRoasTarget: (roasTarget) => set({ roasTarget }),
  setObjective: (objective) =>
    set((s) => ({
      objective,
      adSetBillingEvent: initialAdSetBillingChoice(objective, s.pixelId),
    })),
  setPixelId: (pixelId) =>
    set((s) => ({
      pixelId,
      adSetBillingEvent: initialAdSetBillingChoice(s.objective, pixelId),
    })),
  setAdSetBillingEvent: (adSetBillingEvent) => set({ adSetBillingEvent }),
  setStatus: (status) => set({ status }),
  setStructure: (structure) => set({ structure }),
  setCustomStructure: (value) =>
    set((s) => ({
      customStructure: { ...s.customStructure, ...value },
    })),
  setNomenclatureTokens: (nomenclatureTokens) => set({ nomenclatureTokens }),
  setNomenclaturePreview: (nomenclaturePreview) => set({ nomenclaturePreview }),
  setPublico: (partial) =>
    set((s) => ({
      publico: { ...s.publico, ...partial },
    })),
  setPageId: (pageId) => set({ pageId }),
  setCampaignSchedule: (patch) =>
    set((s) => ({
      campaignSchedule: {
        ...s.campaignSchedule,
        ...patch,
        dayparting: patch.dayparting ?? s.campaignSchedule.dayparting,
      },
    })),
  resetCreatives: () =>
    set((s) => {
      s.creatives.forEach((creative) => URL.revokeObjectURL(creative.preview));
      return { creatives: [] };
    }),
  reset: () =>
    set((s) => {
      s.creatives.forEach((creative) => URL.revokeObjectURL(creative.preview));
      return {
        ...initialState,
        adSetBillingEvent: initialAdSetBillingChoice("OUTCOME_SALES", ""),
        queuePublish: { ...initialQueuePublish },
      };
    }),
  requestPublishJob: () => set({ publishJobTrigger: "wizard" }),
  consumePublishJobTrigger: () => {
    if (get().publishJobTrigger !== "wizard") return null;
    set({ publishJobTrigger: null });
    return "wizard";
  },
  patchQueuePublish: (partial) =>
    set((s) => ({
      queuePublish: { ...s.queuePublish, ...partial },
    })),
}));
