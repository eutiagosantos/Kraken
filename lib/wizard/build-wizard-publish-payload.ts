import type { WizardPublishPayloadInput } from "@/lib/meta/map-wizard-to-graph";
import { adsetAndAdsCountsForWizardShape } from "@/lib/meta/map-wizard-to-graph";
import type { WizardAdSetBillingEvent } from "@/lib/meta/billing-event";
import type { CampaignSchedule } from "@/lib/meta/campaign-schedule";
import { getPublicoGeoValidationErrorPt } from "@/lib/wizard/publico-geo-validation";
import type {
  CampaignType,
  Creative,
  Publico,
  WizardStatus,
  Structure,
  BudgetPeriod,
  BidStrategy,
} from "@/lib/stores/wizardStore";
import { resizeAdSetNames } from "@/lib/stores/wizardStore";

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
  adSetBillingEvent: WizardAdSetBillingEvent | null;
  destinationUrl: string;
  adSetNames: string[];
};

export function buildWizardPublishPayload(wizard: WizardPublishStateSlice): {
  snapshot: WizardPublishPayloadInput;
  creativeFiles: File[];
} {
  const pageId = wizard.pageId?.trim();
  if (!pageId) {
    throw new Error("Escolhe uma Página Facebook no passo 1.");
  }
  const geoErr = getPublicoGeoValidationErrorPt(wizard.publico);
  if (geoErr) {
    throw new Error(geoErr);
  }

  const { adsets, adsPerAdset } = adsetAndAdsCountsForWizardShape(wizard.structure, wizard.customStructure);
  const fuseCreativesPerAdset = wizard.creatives.length === adsets && adsPerAdset === 1;
  if (wizard.creatives.length > 1 && !fuseCreativesPerAdset) {
    throw new Error(
      "Para usar vários criativos na mesma campanha Meta, define uma estrutura em que o número de conjuntos é igual ao número de criativos e há 1 anúncio por conjunto (ex.: personalizada 1-N-1 com N = número de criativos)."
    );
  }

  const destinationUrl = wizard.destinationUrl.trim();
  if (!destinationUrl) {
    throw new Error("Indica a URL do site (https) para o botão «Saiba mais» no passo 2.");
  }
  try {
    const u = new URL(destinationUrl);
    if (u.protocol !== "https:") {
      throw new Error("A URL do site deve começar por https://");
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("A URL")) throw e;
    throw new Error("URL do site inválida. Usa um endereço https completo (ex.: https://example.com).");
  }

  const adSetNamesSynced = resizeAdSetNames(wizard.adSetNames, adsets);

  const snapshot: WizardPublishPayloadInput = {
    selectedAccountIds: wizard.selectedAccountIds,
    creatives: wizard.creatives.map((c) => {
      const trimmed = c.primaryText.trim();
      const displayName = (c.name.trim() || c.file.name).slice(0, 256);
      return {
        id: c.id,
        name: displayName,
        type: c.type,
        ...(trimmed ? { primaryText: trimmed } : {}),
      };
    }),
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
    destinationUrl,
    adSetNames: adSetNamesSynced,
    ...(wizard.adSetBillingEvent != null ? { adSetBillingEvent: wizard.adSetBillingEvent } : {}),
  };

  return {
    snapshot,
    creativeFiles: wizard.creatives.map((c) => c.file),
  };
}
