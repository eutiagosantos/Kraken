import type { WizardPublishPayloadInput } from "@/lib/meta/map-wizard-to-graph";
import { adsetAndAdsCountsForWizardShape } from "@/lib/meta/map-wizard-to-graph";
import type { CatalogPublishPayload } from "@/lib/meta/catalog-publish-payload";
import { catalogPublishPayloadSchema } from "@/lib/meta/catalog-publish-payload";
import type { WizardAdSetBillingEvent } from "@/lib/meta/billing-event";
import type { CampaignSchedule } from "@/lib/meta/campaign-schedule";
import { getPublicoGeoValidationErrorPt } from "@/lib/wizard/publico-geo-validation";
import type {
  CampaignType,
  CatalogCustomEventChoice,
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
  catalogBusinessId: string;
  catalogMetaCatalogId: string;
  catalogProductSetId: string;
  catalogCustomEvent: CatalogCustomEventChoice;
  catalogInstagramActorId: string;
};

function isCatalogDpaReady(wizard: WizardPublishStateSlice): boolean {
  return (
    wizard.campaignType === "DPA" &&
    wizard.catalogBusinessId.trim().length > 0 &&
    wizard.catalogMetaCatalogId.trim().length > 0 &&
    wizard.catalogProductSetId.trim().length > 0 &&
    wizard.pixelId.trim().length > 0
  );
}

/**
 * Quando o assistente está em DPA e os IDs de catálogo estão preenchidos, devolve o body para
 * `POST /api/meta/catalog-publish`. Caso contrário, `null`.
 */
export function tryBuildCatalogPublishPayload(wizard: WizardPublishStateSlice): CatalogPublishPayload | null {
  if (!isCatalogDpaReady(wizard)) return null;
  const pageId = wizard.pageId?.trim();
  if (!pageId) return null;
  const destinationUrl = wizard.destinationUrl.trim();
  if (!destinationUrl) return null;
  try {
    const u = new URL(destinationUrl);
    if (u.protocol !== "https:") return null;
  } catch {
    return null;
  }
  const geoErr = getPublicoGeoValidationErrorPt(wizard.publico);
  if (geoErr) return null;

  const message = (
    wizard.creatives[0]?.primaryText?.trim() ||
    wizard.nomenclaturePreview.trim() ||
    "Catálogo"
  ).slice(0, 2000);
  const ig = wizard.catalogInstagramActorId.trim();

  const parsed = catalogPublishPayloadSchema.safeParse({
    selectedAccountIds: wizard.selectedAccountIds,
    workspaceId: null,
    businessId: wizard.catalogBusinessId.trim(),
    productCatalogId: wizard.catalogMetaCatalogId.trim(),
    productSetId: wizard.catalogProductSetId.trim(),
    pixelId: wizard.pixelId.trim(),
    customEventType: wizard.catalogCustomEvent,
    pageId,
    destinationUrl,
    message,
    ...(ig ? { instagramActorId: ig } : {}),
    catalogCreativeName: wizard.nomenclaturePreview.trim().slice(0, 256) || undefined,
    status: wizard.status,
    objective: wizard.objective,
    budget: wizard.budget,
    budgetPeriod: wizard.budgetPeriod,
    campaignType: "CBO",
    bidStrategy: wizard.bidStrategy,
    ...(wizard.bidLimit !== undefined ? { bidLimit: wizard.bidLimit } : {}),
    nomenclaturePreview: wizard.nomenclaturePreview.trim() || "Campanha Kraken",
    publico: { ...wizard.publico },
    campaignSchedule: { ...wizard.campaignSchedule },
    antiSpy: true,
    ...(wizard.adSetBillingEvent != null ? { adSetBillingEvent: wizard.adSetBillingEvent } : {}),
  });
  return parsed.success ? parsed.data : null;
}

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

  const catalogReady = isCatalogDpaReady(wizard);

  const { adsets, adsPerAdset } = adsetAndAdsCountsForWizardShape(wizard.structure, wizard.customStructure);
  const fuseCreativesPerAdset = wizard.creatives.length === adsets && adsPerAdset === 1;
  if (!catalogReady && wizard.creatives.length > 1 && !fuseCreativesPerAdset) {
    throw new Error(
      "Para usar vários criativos na mesma campanha Meta, define uma estrutura em que o número de conjuntos é igual ao número de criativos e há 1 anúncio por conjunto (ex.: personalizada 1-N-1 com N = número de criativos)."
    );
  }
  if (!catalogReady && wizard.creatives.length === 0) {
    throw new Error("Adiciona pelo menos um criativo no passo 1 (ou preenche os IDs de catálogo para DPA).");
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

  const creativesPayload =
    wizard.creatives.length > 0
      ? wizard.creatives.map((c) => {
          const trimmed = c.primaryText.trim();
          const displayName = (c.name.trim() || c.file.name).slice(0, 256);
          return {
            id: c.id,
            name: displayName,
            type: c.type,
            ...(trimmed ? { primaryText: trimmed } : {}),
          };
        })
      : [{ id: "catalog-dpa-placeholder", name: "Catálogo DPA", type: "image" as const }];

  const snapshot: WizardPublishPayloadInput = {
    selectedAccountIds: wizard.selectedAccountIds,
    creatives: creativesPayload,
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
    ...(catalogReady
      ? {
          catalogBusinessId: wizard.catalogBusinessId.trim(),
          catalogMetaCatalogId: wizard.catalogMetaCatalogId.trim(),
          catalogProductSetId: wizard.catalogProductSetId.trim(),
          catalogCustomEvent: wizard.catalogCustomEvent,
          ...(wizard.catalogInstagramActorId.trim()
            ? { catalogInstagramActorId: wizard.catalogInstagramActorId.trim() }
            : {}),
        }
      : {}),
  };

  return {
    snapshot,
    creativeFiles: wizard.creatives.map((c) => c.file),
  };
}
