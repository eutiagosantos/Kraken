import type { WizardPublishPayloadInput } from "@/lib/meta/map-wizard-to-graph";
import type { CampaignSchedule } from "@/lib/meta/campaign-schedule";
import {
  publicoCountryRegionRequirementMessagePt,
  publicoHasCountryAndRegion,
} from "@/lib/wizard/publico-geo-validation";
import type {
  CampaignType,
  Creative,
  Publico,
  WizardStatus,
  Structure,
  BudgetPeriod,
  BidStrategy,
} from "@/lib/stores/wizardStore";

/** Wizard fields required to build the publish API payload (no store actions). */
export type WizardPublishStateSlice = {
  pageId: string | null;
  selectedAccountIds: string[];
  creatives: Creative[];
  campaignType: CampaignType;
  budget: number;
  budgetPeriod: BudgetPeriod;
  bidStrategy: BidStrategy;
  bidLimit: number | undefined;
  roasTarget: number | undefined;
  objective: string;
  pixelId: string;
  status: WizardStatus;
  structure: Structure;
  customStructure: { campaigns: number; adsets: number; ads: number };
  nomenclaturePreview: string;
  publico: Publico;
  campaignSchedule: CampaignSchedule;
};

export function buildWizardPublishPayload(wizard: WizardPublishStateSlice): {
  snapshot: WizardPublishPayloadInput;
  creativeFiles: File[];
} {
  const pageId = wizard.pageId?.trim();
  if (!pageId) {
    throw new Error("Escolhe uma Página Facebook no passo 1.");
  }
  if (!publicoHasCountryAndRegion(wizard.publico)) {
    throw new Error(publicoCountryRegionRequirementMessagePt());
  }

  const snapshot: WizardPublishPayloadInput = {
    selectedAccountIds: wizard.selectedAccountIds,
    creatives: wizard.creatives.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    campaignType: wizard.campaignType,
    budget: wizard.budget,
    budgetPeriod: wizard.budgetPeriod,
    bidStrategy: wizard.bidStrategy,
    ...(wizard.bidLimit !== undefined ? { bidLimit: wizard.bidLimit } : {}),
    ...(wizard.roasTarget !== undefined ? { roasTarget: wizard.roasTarget } : {}),
    objective: wizard.objective,
    pixelId: wizard.pixelId,
    status: wizard.status,
    structure: wizard.structure,
    customStructure: { ...wizard.customStructure },
    nomenclaturePreview: wizard.nomenclaturePreview.trim() || "Campanha Kraken",
    publico: { ...wizard.publico },
    campaignSchedule: { ...wizard.campaignSchedule },
    antiSpy: true,
    pageId,
  };

  return {
    snapshot,
    creativeFiles: wizard.creatives.map((c) => c.file),
  };
}
