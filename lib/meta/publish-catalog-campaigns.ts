import type { SupabaseClient } from "@supabase/supabase-js";

import { buildCatalogDpaObjectStorySpec } from "@/lib/meta/catalog-ad-creative";
import type { CatalogPublishPayload } from "@/lib/meta/catalog-publish-payload";
import {
  assertCatalogAndProductSet,
  assertPixelOnAdAccount,
  buildCatalogPromotedObject,
} from "@/lib/meta/catalog-promoted-object";
import {
  buildAdsetSchedulePayload,
  buildFrequencyControlSpecs,
  resolveDailyAdsetFlightForPublish,
  resolveLifetimeScheduleForPublish,
} from "@/lib/meta/campaign-schedule";
import {
  defaultBillingEventForOptimizationGoal,
  validBillingEventsForOptimizationGoal,
} from "@/lib/meta/billing-event";
import {
  graphCreateAd,
  graphCreateAdCreativeFromBody,
  graphCreateAdSet,
  graphCreateCampaign,
  graphDeleteCampaign,
  normalizeActId,
} from "@/lib/meta/graph-campaign-publish";
import type { GraphFetch } from "@/lib/meta/graph-client";
import { GraphApiError } from "@/lib/meta/graph-client";
import {
  budgetMinorUnits,
  buildTargetingFromPublico,
  mapBidStrategyToMeta,
  publicoTargetsDsaRegion,
} from "@/lib/meta/map-wizard-to-graph";
import {
  humanizeMetaAppDevelopmentModeError,
  isMetaAppDevelopmentModeError,
} from "@/lib/meta/humanize-graph-publish-error";
import type { Database, Json } from "@/lib/supabase/types";

export type CatalogPublishContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  accessToken: string;
  payload: CatalogPublishPayload;
  accounts: Array<{ meta_account_id: string; name: string }>;
  fetchImpl?: GraphFetch;
};

export type CatalogPublishUnitResult = {
  accountMetaId: string;
  accountName: string;
  ok: boolean;
  error?: string;
  metaCampaignId?: string;
  krakenCampanhaId?: string;
};

function graphErrorMessage(e: unknown): string {
  if (e instanceof GraphApiError && isMetaAppDevelopmentModeError(e)) {
    return humanizeMetaAppDevelopmentModeError(e);
  }
  if (e instanceof GraphApiError) {
    const title = e.errorUserTitle ? `${e.errorUserTitle}: ` : "";
    let out = `${title}${e.message}`;
    const u = e.errorUserMsg?.trim();
    if (u && !e.message.includes(u)) out = `${out} — ${u}`;
    return out;
  }
  if (e instanceof Error) return e.message;
  return "Erro desconhecido.";
}

function resolveBillingForCatalog(payload: CatalogPublishPayload): string {
  const og = "OFFSITE_CONVERSIONS";
  const choice = payload.adSetBillingEvent;
  if (choice != null && validBillingEventsForOptimizationGoal(og).includes(choice)) {
    return choice;
  }
  return defaultBillingEventForOptimizationGoal(og);
}

/** Publishes one campaign + ad set + catalog template creative per selected ad account. */
export async function runCatalogPublish(ctx: CatalogPublishContext): Promise<{
  results: CatalogPublishUnitResult[];
  warnings: string[];
}> {
  const fetchImpl = ctx.fetchImpl ?? fetch;
  const warnings: string[] = [];
  const { targeting, usedFallbackGeo, fallbackCountry } = buildTargetingFromPublico(ctx.payload.publico);
  const workingTargeting = JSON.parse(JSON.stringify(targeting)) as Record<string, unknown>;
  if (usedFallbackGeo) {
    warnings.push(
      `Localização: nenhum país definido no público; usado fallback ${fallbackCountry ?? "BR"} para o catálogo.`
    );
  }

  const totalMinor = budgetMinorUnits(ctx.payload.budget);
  const isCbo = ctx.payload.campaignType === "CBO";
  const isLifetime = ctx.payload.budgetPeriod === "lifetime";
  const lifetimeSchedule = resolveLifetimeScheduleForPublish(ctx.payload.budgetPeriod, ctx.payload.campaignSchedule);
  const dailyAdsetFlight = !isLifetime ? resolveDailyAdsetFlightForPublish(ctx.payload.campaignSchedule) : null;
  const adsetScheduleRows = buildAdsetSchedulePayload(ctx.payload.campaignSchedule);
  const frequencyControlSpecs = buildFrequencyControlSpecs(ctx.payload.campaignSchedule);
  const billingEvent = resolveBillingForCatalog(ctx.payload);
  const bid = mapBidStrategyToMeta(ctx.payload.bidStrategy, ctx.payload.bidLimit);
  const campaignBidStrategy = isCbo ? bid.bid_strategy : undefined;
  const adSetBidStrategy = isCbo ? undefined : bid.bid_strategy;
  const adSetBidAmount = !isCbo
    ? bid.bid_amount
    : bid.bid_strategy === "LOWEST_COST_WITH_BID_CAP" || bid.bid_strategy === "COST_CAP"
      ? bid.bid_amount
      : undefined;

  const needsDsa = publicoTargetsDsaRegion(ctx.payload.publico);
  const dsaBeneficiary = process.env.META_DSA_BENEFICIARY?.trim();
  const dsaPayor = process.env.META_DSA_PAYOR?.trim();
  if (needsDsa && (!dsaBeneficiary || !dsaPayor)) {
    warnings.push(
      "DSA: público em região UE/UK — configure META_DSA_BENEFICIARY e META_DSA_PAYOR no servidor para o Meta aceitar o conjunto."
    );
  }
  const dsaForAdset =
    needsDsa && dsaBeneficiary && dsaPayor
      ? { dsaBeneficiary, dsaPayor }
      : { dsaBeneficiary: undefined, dsaPayor: undefined };

  const promotedObject = buildCatalogPromotedObject({
    productCatalogId: ctx.payload.productCatalogId,
    productSetId: ctx.payload.productSetId,
    pixelId: ctx.payload.pixelId,
    customEventType: ctx.payload.customEventType,
  });

  const optimizationGoal = "OFFSITE_CONVERSIONS";

  const results: CatalogPublishUnitResult[] = [];

  for (const acc of ctx.accounts) {
    const actId = normalizeActId(acc.meta_account_id);
    const base: CatalogPublishUnitResult = {
      accountMetaId: actId,
      accountName: acc.name,
      ok: false,
    };

    let createdCampaignId: string | undefined;
    try {
      await assertPixelOnAdAccount({
        actId,
        accessToken: ctx.accessToken,
        pixelId: ctx.payload.pixelId,
        fetchImpl,
      });
      await assertCatalogAndProductSet({
        catalogId: ctx.payload.productCatalogId,
        productSetId: ctx.payload.productSetId,
        accessToken: ctx.accessToken,
        fetchImpl,
      });

      const campaignDaily = isCbo && !isLifetime ? totalMinor : undefined;
      const campaignLifetime = isCbo && isLifetime ? totalMinor : undefined;
      const perAdsetDaily = !isCbo && !isLifetime ? Math.max(100, totalMinor) : undefined;
      const perAdsetLifetime = !isCbo && isLifetime ? Math.max(100, totalMinor) : undefined;

      let adsetStartTime: string | undefined;
      let adsetEndTime: string | number | undefined;
      if (isLifetime && lifetimeSchedule) {
        adsetStartTime = lifetimeSchedule.startTime;
        adsetEndTime = lifetimeSchedule.endTime;
      } else if (dailyAdsetFlight) {
        adsetStartTime = dailyAdsetFlight.startTime;
        adsetEndTime = dailyAdsetFlight.endTime;
      }

      const campaign = await graphCreateCampaign({
        actId,
        accessToken: ctx.accessToken,
        name: `${ctx.payload.nomenclaturePreview || "Kraken Catalog"} · ${acc.name}`.slice(0, 240),
        objective: ctx.payload.objective,
        status: ctx.payload.status,
        dailyBudgetMinor: campaignDaily,
        lifetimeBudgetMinor: campaignLifetime ?? undefined,
        startTime: isCbo && isLifetime && lifetimeSchedule ? lifetimeSchedule.startTime : undefined,
        endTime: isCbo && isLifetime && lifetimeSchedule ? lifetimeSchedule.endTime : undefined,
        bidStrategy: campaignBidStrategy,
        fetchImpl,
      });
      createdCampaignId = campaign.id;

      const adset = await graphCreateAdSet({
        actId,
        accessToken: ctx.accessToken,
        name: `Conjunto catálogo · ${acc.name}`.slice(0, 256),
        campaignId: campaign.id,
        targeting: workingTargeting,
        optimizationGoal,
        promotedObject,
        billingEvent,
        bidStrategy: adSetBidStrategy,
        bidAmount: adSetBidAmount,
        dailyBudgetMinor: perAdsetDaily,
        lifetimeBudgetMinor: perAdsetLifetime,
        startTime: adsetStartTime,
        endTime: adsetEndTime,
        destinationType: "WEBSITE",
        ...dsaForAdset,
        status: ctx.payload.status,
        adsetSchedule: adsetScheduleRows,
        frequencyControlSpecs,
        fetchImpl,
      });

      const objectStorySpec = buildCatalogDpaObjectStorySpec({
        pageId: ctx.payload.pageId,
        link: ctx.payload.destinationUrl,
        message: ctx.payload.message,
        name: ctx.payload.catalogCreativeName,
        instagramActorId: ctx.payload.instagramActorId,
      });

      const creativeName = (ctx.payload.catalogCreativeName || "Catálogo DPA").slice(0, 240);
      const creative = await graphCreateAdCreativeFromBody({
        actId,
        accessToken: ctx.accessToken,
        name: `${creativeName} · ${acc.name}`.slice(0, 240),
        body: { object_story_spec: objectStorySpec },
        fetchImpl,
      });

      const ad = await graphCreateAd({
        actId,
        accessToken: ctx.accessToken,
        name: creativeName.slice(0, 240),
        adSetId: adset.id,
        creativeId: creative.id,
        status: ctx.payload.status,
        fetchImpl,
      });

      const metaIds: Json = {
        campaignId: campaign.id,
        adSetIds: [adset.id],
        adCreativeIds: [creative.id],
        adIds: [ad.id],
        catalog: {
          businessId: ctx.payload.businessId,
          productCatalogId: ctx.payload.productCatalogId,
          productSetId: ctx.payload.productSetId,
          pixelId: ctx.payload.pixelId,
          customEventType: ctx.payload.customEventType,
        },
      };

      const { data: inserted, error: insErr } = await ctx.supabase
        .from("campanhas")
        .insert({
          user_id: ctx.userId,
          workspace_id: ctx.payload.workspaceId ?? null,
          name: `${ctx.payload.nomenclaturePreview || "Campanha catálogo"} · ${acc.name}`.slice(0, 240),
          account_name: acc.name,
          account_meta_id: actId.replace(/^act_/i, ""),
          structure: "1-1-1",
          objective: ctx.payload.objective,
          daily_budget: ctx.payload.budget,
          anti_spy: ctx.payload.antiSpy ?? true,
          status: "concluida",
          ads_created: 1,
          ads_total: 1,
          trend: [] as unknown as Json,
          creatives: [{ id: "catalog", name: creativeName, type: "image", thumb: "" }] as unknown as Json,
          errors: null,
          meta_ids: metaIds,
        })
        .select("id")
        .single();

      if (insErr) throw new Error(insErr.message);

      results.push({
        ...base,
        ok: true,
        metaCampaignId: campaign.id,
        krakenCampanhaId: inserted?.id,
      });
      createdCampaignId = undefined;
    } catch (e) {
      if (createdCampaignId) {
        try {
          await graphDeleteCampaign({
            campaignId: createdCampaignId,
            accessToken: ctx.accessToken,
            fetchImpl,
          });
        } catch {
          /* best-effort */
        }
      }
      results.push({ ...base, error: graphErrorMessage(e) });
    }
  }

  return { results, warnings };
}
