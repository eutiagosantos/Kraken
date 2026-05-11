import { mockAccounts, type MockAccount } from "@/lib/mock-data";
import {
  mockInterestOptions,
  mockLocationOptions,
  mockPixels,
  mockSavedPresets,
  mockSavedPublicos,
  type WizardInterestOption,
  type WizardLocationOption,
  type WizardPixel,
  type WizardPreset,
} from "@/lib/mock-data/wizard";
import type { Publico } from "@/lib/stores/wizardStore";

export interface PublishPayload {
  selectedAccountIds: string[];
  creativeIds: string[];
  estimatedCampaigns: number;
}

export interface WizardDataAdapter {
  listAccounts: () => Promise<MockAccount[]>;
  listPixels: () => Promise<WizardPixel[]>;
  listSavedPresets: () => Promise<WizardPreset[]>;
  listSavedPublicos: () => Promise<Publico[]>;
  listLocationOptions: () => Promise<WizardLocationOption[]>;
  listInterestOptions: () => Promise<WizardInterestOption[]>;
  savePublico: (publico: Publico) => Promise<Publico>;
  publishCampaigns: (payload: PublishPayload) => Promise<{ publishId: string }>;
}

const sleep = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockWizardDataAdapter: WizardDataAdapter = {
  async listAccounts() {
    await sleep();
    return mockAccounts;
  },
  async listPixels() {
    await sleep();
    return mockPixels;
  },
  async listSavedPresets() {
    await sleep();
    return mockSavedPresets;
  },
  async listSavedPublicos() {
    await sleep();
    return mockSavedPublicos;
  },
  async listLocationOptions() {
    await sleep();
    return mockLocationOptions;
  },
  async listInterestOptions() {
    await sleep();
    return mockInterestOptions;
  },
  async savePublico(publico) {
    await sleep();
    return { ...publico, type: "saved" };
  },
  async publishCampaigns() {
    await sleep(400);
    return { publishId: `pub_${Date.now()}` };
  },
};
