import type { WizardPublishPayload } from "@/lib/meta/map-wizard-to-graph";
import { structureLabelForDb } from "@/lib/meta/map-wizard-to-graph";
import type { Json } from "@/lib/supabase/types";

const MAX_CREATIVE_NAMES = 8;

/**
 * Persisted on `upload_jobs.summary` when a publish run starts (server-only fields).
 * Versioned so clients can evolve parsing.
 */
export function buildUploadJobSummary(
  payload: WizardPublishPayload,
  accounts: Array<{ meta_account_id: string; name: string }>
): Json {
  const structureDb = structureLabelForDb(payload);
  const names = payload.creatives.map((c) => c.name);
  const creativeNames = names.slice(0, MAX_CREATIVE_NAMES);
  const creativeNamesExtra = Math.max(0, names.length - creativeNames.length);

  const structureDisplay =
    payload.structure === "custom"
      ? `${payload.customStructure.campaigns}-${payload.customStructure.adsets}-${payload.customStructure.ads}`
      : payload.structure;

  const accountRows: Json[] = accounts.map((a) => ({
    meta_account_id: a.meta_account_id,
    name: a.name,
  }));

  const row: Record<string, Json> = {
    v: 1,
    nomenclaturePreview: payload.nomenclaturePreview,
    objective: payload.objective,
    campaignType: payload.campaignType,
    budget: payload.budget,
    budgetPeriod: payload.budgetPeriod,
    bidStrategy: payload.bidStrategy,
    structure: payload.structure,
    structureDisplay,
    structureLabel: structureDb,
    creativeCount: payload.creatives.length,
    creativeNames,
    accounts: accountRows,
    publicoName: payload.publico.name,
    campaignStatus: payload.status,
    antiSpy: payload.antiSpy ?? true,
  };

  if (payload.structure === "custom") {
    row.customStructure = {
      campaigns: payload.customStructure.campaigns,
      adsets: payload.customStructure.adsets,
      ads: payload.customStructure.ads,
    };
  }
  if (creativeNamesExtra > 0) {
    row.creativeNamesExtra = creativeNamesExtra;
  }
  const pixel = payload.pixelId.trim();
  if (pixel) {
    row.pixelId = pixel;
  }
  if (payload.workspaceId != null && payload.workspaceId !== "") {
    row.workspaceId = payload.workspaceId;
  }

  return row;
}
