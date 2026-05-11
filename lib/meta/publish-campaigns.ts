import type { SupabaseClient } from "@supabase/supabase-js";

import { uploadAdImageToAccount } from "@/lib/meta/graph-ad-images";
import {
  fetchPreferredAdVideoThumbnail,
  uploadAdVideoChunked,
  waitForAdVideoReady,
} from "@/lib/meta/graph-ad-videos";
import {
  graphCreateAd,
  graphCreateAdCreative,
  graphCreateAdSet,
  graphCreateCampaign,
  graphDeleteCampaign,
  normalizeActId,
  type AdCreativeMedia,
} from "@/lib/meta/graph-campaign-publish";
import type { GraphFetch } from "@/lib/meta/graph-client";
import { GraphApiError } from "@/lib/meta/graph-client";
import {
  billingEventForOptimization,
  budgetMinorUnits,
  buildTargetingFromPublico,
  defaultLifetimeSchedule,
  mapBidStrategyToMeta,
  publicoTargetsDsaRegion,
  resolveStructureCounts,
  selectOptimizationForObjective,
  structureLabelForDb,
  type WizardPublishPayload,
} from "@/lib/meta/map-wizard-to-graph";
import type { Database, Json } from "@/lib/supabase/types";

export type WizardPublishContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  accessToken: string;
  payload: WizardPublishPayload;
  /** Binary per creative index (same order as payload.creatives) */
  creativeFilesByIndex: Map<number, { buffer: Buffer; mimeType: string }>;
  /** Facebook Page for link ads */
  pageId: string;
  /** Destination URL in creative */
  adLinkUrl: string;
  /** Verified rows: meta_account_id + display name */
  accounts: Array<{ meta_account_id: string; name: string }>;
  /** Linha `upload_jobs` criada em POST /api/wizard/publish/init (status `awaiting_creatives`). */
  existingPublishJobId: string;
  fetchImpl?: GraphFetch;
};

export type PublishUnitResult = {
  accountMetaId: string;
  accountName: string;
  creativeIndex: number;
  creativeId: string;
  creativeName: string;
  ok: boolean;
  error?: string;
  metaCampaignId?: string;
  krakenCampanhaId?: string;
};

function graphErrorMessage(e: unknown): string {
  if (e instanceof GraphApiError) {
    const title = e.errorUserTitle ? `${e.errorUserTitle}: ` : "";
    return `${title}${e.message}`;
  }
  if (e instanceof Error) return e.message;
  return "Erro desconhecido.";
}

export async function runWizardPublish(ctx: WizardPublishContext): Promise<{
  publishId: string;
  results: PublishUnitResult[];
  warnings: string[];
}> {
  const fetchImpl = ctx.fetchImpl ?? fetch;
  const warnings: string[] = [];
  const { targeting, usedFallbackGeo, fallbackCountry } = buildTargetingFromPublico(ctx.payload.publico);
  if (usedFallbackGeo) {
    warnings.push(
      `Localização: nenhum país definido no público; usado fallback ${fallbackCountry ?? "BR"} (só países com chave ISO de 2 letras em «country» são enviados ao Meta).`
    );
  }

  const counts = resolveStructureCounts(ctx.payload);
  const structureDb = structureLabelForDb(ctx.payload, counts);
  const totalMinor = budgetMinorUnits(ctx.payload.budget);
  const isCbo = ctx.payload.campaignType === "CBO" || ctx.payload.campaignType === "DPA";
  const opt = selectOptimizationForObjective(ctx.payload.objective, ctx.payload.pixelId);
  if (
    (ctx.payload.objective === "OUTCOME_SALES" || ctx.payload.objective === "OUTCOME_LEADS") &&
    !ctx.payload.pixelId.trim()
  ) {
    warnings.push(
      "Sem pixel: o Meta pode falhar com objetivo de conversões; usámos otimização alternativa (tráfego/cliques) onde aplicável."
    );
  }
  const bid = mapBidStrategyToMeta(ctx.payload.bidStrategy, ctx.payload.bidLimit);
  const isLifetime = ctx.payload.budgetPeriod === "lifetime";
  const lifetimeSchedule = isLifetime ? defaultLifetimeSchedule(30) : null;
  const billingEvent = billingEventForOptimization(opt.optimization_goal);
  const needsDsa = publicoTargetsDsaRegion(ctx.payload.publico);
  const dsaBeneficiary = process.env.META_DSA_BENEFICIARY?.trim();
  const dsaPayor = process.env.META_DSA_PAYOR?.trim();
  if (needsDsa && (!dsaBeneficiary || !dsaPayor)) {
    warnings.push(
      "Público inclui país UE/EEA: define META_DSA_BENEFICIARY e META_DSA_PAYOR no servidor (texto legal da entidade anunciante) para o Meta aceitar conjuntos com transparência DSA; caso contrário a criação do conjunto pode falhar."
    );
  }
  const dsaForAdset =
    needsDsa && dsaBeneficiary && dsaPayor ? { dsaBeneficiary, dsaPayor } : {};
  const destinationType = ctx.payload.objective === "OUTCOME_TRAFFIC" ? "WEBSITE" : undefined;

  const units: Array<{ actId: string; accountName: string; creativeIndex: number }> = [];
  for (const acc of ctx.accounts) {
    const actId = normalizeActId(acc.meta_account_id);
    for (let i = 0; i < ctx.payload.creatives.length; i++) {
      units.push({ actId, accountName: acc.name, creativeIndex: i });
    }
  }

  if (units.length === 0) {
    throw new Error("Nenhuma conta válida para publicar.");
  }

  const { data: jobRow, error: jobErr } = await ctx.supabase
    .from("upload_jobs")
    .update({
      account_name: units.length === 1 ? units[0].accountName : `${units.length} contas`,
      total: units.length,
      done: 0,
      status: "processing",
    })
    .eq("id", ctx.existingPublishJobId)
    .eq("user_id", ctx.userId)
    .select("id")
    .single();

  if (jobErr || !jobRow) {
    throw new Error(jobErr?.message ?? "Falha ao preparar upload_jobs (operação inválida ou já usada).");
  }
  const publishId = jobRow.id;

  const results: PublishUnitResult[] = [];
  let done = 0;

  for (const unit of units) {
    const creative = ctx.payload.creatives[unit.creativeIndex];
    const baseResult: PublishUnitResult = {
      accountMetaId: unit.actId,
      accountName: unit.accountName,
      creativeIndex: unit.creativeIndex,
      creativeId: creative.id,
      creativeName: creative.name,
      ok: false,
    };

    const file = ctx.creativeFilesByIndex.get(unit.creativeIndex);
    if (!file?.buffer?.length) {
      const msg = "Ficheiro do criativo em falta no pedido multipart.";
      results.push({ ...baseResult, error: msg });
      await persistFailedCampanha(ctx, { unit, creative, structureDb, error: msg });
      done += 1;
      await ctx.supabase.from("upload_jobs").update({ done }).eq("id", publishId);
      continue;
    }

    let createdCampaignId: string | undefined;
    try {
      let media: AdCreativeMedia;
      if (creative.type === "video") {
        const { videoId } = await uploadAdVideoChunked({
          actId: unit.actId,
          accessToken: ctx.accessToken,
          fileName: creative.name,
          buffer: file.buffer,
          mimeType: file.mimeType || "video/mp4",
          fetchImpl,
        });
        await waitForAdVideoReady({
          videoId,
          accessToken: ctx.accessToken,
          fetchImpl,
        });
        const { imageUrl } = await fetchPreferredAdVideoThumbnail({
          videoId,
          accessToken: ctx.accessToken,
          fetchImpl,
        });
        media = { kind: "video", videoId, thumbnailImageUrl: imageUrl };
      } else {
        const { hash } = await uploadAdImageToAccount({
          actId: unit.actId,
          accessToken: ctx.accessToken,
          fileName: creative.name,
          buffer: file.buffer,
          mimeType: file.mimeType || "image/jpeg",
          fetchImpl,
        });
        media = { kind: "image", imageHash: hash };
      }

      const campaignDaily = isCbo && !isLifetime ? totalMinor : undefined;
      const campaignLifetime = isCbo && isLifetime ? totalMinor : undefined;
      const campaign = await graphCreateCampaign({
        actId: unit.actId,
        accessToken: ctx.accessToken,
        name: `${ctx.payload.nomenclaturePreview || "Kraken"} · ${unit.accountName}`.slice(0, 240),
        objective: ctx.payload.objective,
        status: ctx.payload.status,
        dailyBudgetMinor: campaignDaily,
        lifetimeBudgetMinor: campaignLifetime ?? undefined,
        startTime: isCbo && isLifetime && lifetimeSchedule ? lifetimeSchedule.startTime : undefined,
        endTime: isCbo && isLifetime && lifetimeSchedule ? lifetimeSchedule.endTime : undefined,
        fetchImpl,
      });
      createdCampaignId = campaign.id;

      const creativeName = `${creative.name} · ${unit.accountName}`.slice(0, 240);
      const adCreative = await graphCreateAdCreative({
        actId: unit.actId,
        accessToken: ctx.accessToken,
        name: creativeName,
        pageId: ctx.pageId,
        media,
        linkUrl: ctx.adLinkUrl,
        message: creative.name,
        fetchImpl,
      });

      const adSetIds: string[] = [];
      const adIds: string[] = [];
      const perAdsetDaily =
        !isCbo && !isLifetime && counts.adsets > 0
          ? Math.max(100, Math.floor(totalMinor / counts.adsets))
          : undefined;
      const perAdsetLifetimeMinor =
        !isCbo && isLifetime && counts.adsets > 0
          ? Math.max(100, Math.floor(totalMinor / counts.adsets))
          : undefined;

      for (let si = 0; si < counts.adsets; si++) {
        const adset = await graphCreateAdSet({
          actId: unit.actId,
          accessToken: ctx.accessToken,
          name: `Conjunto ${si + 1}`.slice(0, 240),
          campaignId: campaign.id,
          targeting,
          optimizationGoal: opt.optimization_goal,
          promotedObject: opt.promoted_object,
          billingEvent,
          bidStrategy: bid.bid_strategy,
          bidAmount: bid.bid_amount,
          dailyBudgetMinor: perAdsetDaily,
          lifetimeBudgetMinor: perAdsetLifetimeMinor,
          startTime: isLifetime && lifetimeSchedule ? lifetimeSchedule.startTime : undefined,
          endTime: isLifetime && lifetimeSchedule ? lifetimeSchedule.endTime : undefined,
          destinationType,
          ...dsaForAdset,
          status: ctx.payload.status,
          fetchImpl,
        });
        adSetIds.push(adset.id);

        for (let ai = 0; ai < counts.adsPerAdset; ai++) {
          const ad = await graphCreateAd({
            actId: unit.actId,
            accessToken: ctx.accessToken,
            name: `Anúncio ${si + 1}-${ai + 1}`.slice(0, 240),
            adSetId: adset.id,
            creativeId: adCreative.id,
            status: ctx.payload.status,
            fetchImpl,
          });
          adIds.push(ad.id);
        }
      }

      const adsTotal = counts.adsets * counts.adsPerAdset;
      const metaIds: Json = {
        campaignId: campaign.id,
        adCreativeId: adCreative.id,
        adSetIds,
        adIds,
      };

      const { data: inserted, error: insErr } = await ctx.supabase
        .from("campanhas")
        .insert({
          user_id: ctx.userId,
          workspace_id: ctx.payload.workspaceId ?? null,
          name: `${ctx.payload.nomenclaturePreview || "Campanha"} · ${creative.name}`.slice(0, 240),
          account_name: unit.accountName,
          account_meta_id: unit.actId.replace(/^act_/i, ""),
          structure: structureDb,
          objective: ctx.payload.objective,
          daily_budget: ctx.payload.budget,
          anti_spy: ctx.payload.antiSpy ?? true,
          status: "concluida",
          ads_created: adsTotal,
          ads_total: adsTotal,
          trend: [] as unknown as Json,
          creatives: [
            {
              id: creative.id,
              name: creative.name,
              type: creative.type,
              thumb: "",
            },
          ] as unknown as Json,
          errors: null,
          meta_ids: metaIds,
        })
        .select("id")
        .single();

      if (insErr) {
        throw new Error(insErr.message);
      }

      results.push({
        ...baseResult,
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
          /* rollback best-effort */
        }
        createdCampaignId = undefined;
      }
      const msg = graphErrorMessage(e);
      results.push({ ...baseResult, error: msg });
      await persistFailedCampanha(ctx, { unit, creative, structureDb, error: msg });
    }

    done += 1;
    await ctx.supabase.from("upload_jobs").update({ done }).eq("id", publishId);
  }

  const okCount = results.filter((r) => r.ok).length;
  const jobStatus: "completed" | "error" = okCount === 0 ? "error" : "completed";
  await ctx.supabase.from("upload_jobs").update({ status: jobStatus }).eq("id", publishId);

  if (okCount > 0) {
    await ctx.supabase.from("activity_events").insert({
      user_id: ctx.userId,
      type: "success",
      message: `Publicação: ${okCount} campanha(s) criada(s) no Meta.`,
      account: units[0]?.accountName ?? "—",
    });
  }

  return { publishId, results, warnings };
}

async function persistFailedCampanha(
  ctx: WizardPublishContext,
  args: {
    unit: { actId: string; accountName: string; creativeIndex: number };
    creative: WizardPublishPayload["creatives"][number];
    structureDb: string;
    error: string;
  }
): Promise<void> {
  const sc = resolveStructureCounts(ctx.payload);
  const adsTotal = sc.adsets * sc.adsPerAdset;
  await ctx.supabase.from("campanhas").insert({
    user_id: ctx.userId,
    workspace_id: ctx.payload.workspaceId ?? null,
    name: `${ctx.payload.nomenclaturePreview || "Campanha"} · ${args.creative.name}`.slice(0, 240),
    account_name: args.unit.accountName,
    account_meta_id: args.unit.actId.replace(/^act_/i, ""),
    structure: args.structureDb,
    objective: ctx.payload.objective,
    daily_budget: ctx.payload.budget,
    anti_spy: ctx.payload.antiSpy ?? true,
    status: "erro",
    ads_created: 0,
    ads_total: adsTotal,
    trend: [] as unknown as Json,
    creatives: [
      { id: args.creative.id, name: args.creative.name, type: args.creative.type, thumb: "" },
    ] as unknown as Json,
    errors: [{ id: "publish", message: args.error, adName: args.creative.name }] as unknown as Json,
    meta_ids: null,
  });
}
