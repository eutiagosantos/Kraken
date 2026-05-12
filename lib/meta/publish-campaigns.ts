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
import {
  applyInterestReplacementsToTargeting,
  parseDeprecatedInterestReplacements,
  replacementsToMap,
} from "@/lib/meta/deprecated-targeting-interests";
import {
  humanizeMetaAppDevelopmentModeError,
  humanizeMetaAudienceTooNarrowError,
  humanizeMetaBillingUnavailableError,
  humanizeMetaDetailedTargetingInvalidError,
  isMetaAppDevelopmentModeError,
  isMetaAudienceTooNarrowError,
  isMetaBillingUnavailableError,
  isMetaDetailedTargetingInvalidParameterError,
} from "@/lib/meta/humanize-graph-publish-error";
import type { GraphFetch } from "@/lib/meta/graph-client";
import { GraphApiError } from "@/lib/meta/graph-client";
import {
  billingEventForOptimization,
  budgetMinorUnits,
  buildTargetingFromPublico,
  mapBidStrategyToMeta,
  publicoTargetsDsaRegion,
  resolveStructureCounts,
  selectOptimizationForObjective,
  structureLabelForDb,
  type WizardPublishPayload,
} from "@/lib/meta/map-wizard-to-graph";
import {
  buildAdsetSchedulePayload,
  buildFrequencyControlSpecs,
  resolveDailyAdsetFlightForPublish,
  resolveLifetimeScheduleForPublish,
} from "@/lib/meta/campaign-schedule";
import { buildUploadJobSummary } from "@/lib/meta/upload-job-summary";
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

function buildUploadJobErrorDetails(results: PublishUnitResult[], warnings: string[]): Json | null {
  const failed = results.filter((r) => !r.ok && r.error);
  if (failed.length === 0) return null;

  return {
    v: 1,
    message:
      failed.length === results.length
        ? "Nenhuma publicação concluiu com sucesso no Meta."
        : "Algumas publicações falharam no Meta.",
    items: failed.map((r) => ({
      accountName: r.accountName,
      creativeName: r.creativeName,
      error: r.error ?? "Erro desconhecido.",
    })),
    ...(warnings.length > 0 ? { warnings } : {}),
  } as Json;
}

function graphErrorMessage(e: unknown): string {
  if (e instanceof GraphApiError && isMetaAppDevelopmentModeError(e)) {
    return humanizeMetaAppDevelopmentModeError(e);
  }
  if (e instanceof GraphApiError && isMetaAudienceTooNarrowError(e)) {
    return humanizeMetaAudienceTooNarrowError(e);
  }
  if (e instanceof GraphApiError && isMetaDetailedTargetingInvalidParameterError(e)) {
    const repl = parseDeprecatedInterestReplacements(e.rawBody);
    if (repl.length === 0) {
      return humanizeMetaDetailedTargetingInvalidError(e);
    }
  }
  if (e instanceof GraphApiError && isMetaBillingUnavailableError(e)) {
    return humanizeMetaBillingUnavailableError(e);
  }
  if (e instanceof GraphApiError) {
    const title = e.errorUserTitle ? `${e.errorUserTitle}: ` : "";
    let out = `${title}${e.message}`;
    const u = e.errorUserMsg?.trim();
    if (u && !e.message.includes(u)) {
      out = `${out} — ${u}`;
    }
    const d = e.errorDataSummary?.trim();
    if (d && !out.includes(d.slice(0, Math.min(80, d.length)))) {
      out = `${out} [${d}]`;
    }
    return out;
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
  const { targeting: initialTargeting, usedFallbackGeo, fallbackCountry } = buildTargetingFromPublico(
    ctx.payload.publico
  );
  const workingTargeting = JSON.parse(JSON.stringify(initialTargeting)) as Record<string, unknown>;
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
  const campaignBidStrategy = isCbo ? bid.bid_strategy : undefined;
  const adSetBidStrategy = isCbo ? undefined : bid.bid_strategy;
  const adSetBidAmount = !isCbo
    ? bid.bid_amount
    : bid.bid_strategy === "LOWEST_COST_WITH_BID_CAP" || bid.bid_strategy === "COST_CAP"
      ? bid.bid_amount
      : undefined;
  const isLifetime = ctx.payload.budgetPeriod === "lifetime";
  const lifetimeSchedule = resolveLifetimeScheduleForPublish(
    ctx.payload.budgetPeriod,
    ctx.payload.campaignSchedule
  );
  const dailyAdsetFlight = !isLifetime ? resolveDailyAdsetFlightForPublish(ctx.payload.campaignSchedule) : null;
  const adsetScheduleRows = buildAdsetSchedulePayload(ctx.payload.campaignSchedule);
  const frequencyControlSpecs = buildFrequencyControlSpecs(ctx.payload.campaignSchedule);
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
  if (ctx.payload.campaignSchedule.dayparting.enabled) {
    warnings.push(
      "Dayparting: os intervalos são aplicados na timezone da conta de anúncios no Meta (não na hora local do browser)."
    );
  }
  if (ctx.payload.campaignSchedule.frequencyCap) {
    warnings.push(
      "Limite de frequência: se o Meta rejeitar a combinação com o objetivo, ajusta ou remove o limite e volta a publicar."
    );
  }
  if (dailyAdsetFlight) {
    warnings.push(
      "Voo (início/fim): o assistente grava as datas como ISO no browser (hora local ao escolher no calendário); o Meta recebe `start_time`/`end_time` em UTC+0000 para esse instante. Isto não substitui a timezone da conta de anúncios para outros campos (ex.: dayparting)."
    );
  }

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

  const summary = buildUploadJobSummary(ctx.payload, ctx.accounts);

  const { data: jobRow, error: jobErr } = await ctx.supabase
    .from("upload_jobs")
    .update({
      account_name: units.length === 1 ? units[0].accountName : `${units.length} contas`,
      total: units.length,
      done: 0,
      status: "processing",
      summary,
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

    let creativeThumbForRow = "";
    let createdCampaignId: string | undefined;
    try {
      const campaignDaily = isCbo && !isLifetime ? totalMinor : undefined;
      const campaignLifetime = isCbo && isLifetime ? totalMinor : undefined;
      const perAdsetDaily =
        !isCbo && !isLifetime && counts.adsets > 0
          ? Math.max(100, Math.floor(totalMinor / counts.adsets))
          : undefined;
      const perAdsetLifetimeMinor =
        !isCbo && isLifetime && counts.adsets > 0
          ? Math.max(100, Math.floor(totalMinor / counts.adsets))
          : undefined;

      let adsetStartTime: string | undefined;
      let adsetEndTime: string | number | undefined;
      if (isLifetime && lifetimeSchedule) {
        adsetStartTime = lifetimeSchedule.startTime;
        adsetEndTime = lifetimeSchedule.endTime;
      } else if (dailyAdsetFlight) {
        adsetStartTime = dailyAdsetFlight.startTime;
        adsetEndTime = dailyAdsetFlight.endTime;
      }

      const maxDeprecatedInterestAttempts = 3;
      let campaign!: { id: string };
      let adSetIds: string[] = [];
      let effectiveBillingEvent = billingEvent;

      for (let depAttempt = 0; depAttempt < maxDeprecatedInterestAttempts; depAttempt++) {
        try {
          campaign = await graphCreateCampaign({
            actId: unit.actId,
            accessToken: ctx.accessToken,
            name: `${ctx.payload.nomenclaturePreview || "Kraken"} · ${unit.accountName}`.slice(0, 240),
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

          adSetIds = [];
          for (let si = 0; si < counts.adsets; si++) {
            const adset = await graphCreateAdSet({
              actId: unit.actId,
              accessToken: ctx.accessToken,
              name: `Conjunto ${si + 1}`.slice(0, 240),
              campaignId: campaign.id,
              targeting: workingTargeting,
              optimizationGoal: opt.optimization_goal,
              promotedObject: opt.promoted_object,
              billingEvent: effectiveBillingEvent,
              bidStrategy: adSetBidStrategy,
              bidAmount: adSetBidAmount,
              dailyBudgetMinor: perAdsetDaily,
              lifetimeBudgetMinor: perAdsetLifetimeMinor,
              startTime: adsetStartTime,
              endTime: adsetEndTime,
              destinationType,
              ...dsaForAdset,
              status: ctx.payload.status,
              adsetSchedule: adsetScheduleRows,
              frequencyControlSpecs,
              fetchImpl,
            });
            adSetIds.push(adset.id);
          }
          break;
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

          if (
            e instanceof GraphApiError &&
            isMetaBillingUnavailableError(e) &&
            effectiveBillingEvent === "IMPRESSIONS" &&
            depAttempt < maxDeprecatedInterestAttempts - 1
          ) {
            effectiveBillingEvent = "LINK_CLICKS";
            warnings.push(
              "Opção de cobrança IMPRESSIONS indisponível nesta conta (conta nova no Meta); a publicação foi retentada com cobrança por LINK_CLICKS."
            );
            continue;
          }

          const repl =
            e instanceof GraphApiError ? parseDeprecatedInterestReplacements(e.rawBody) : [];
          const { changed } =
            repl.length > 0
              ? applyInterestReplacementsToTargeting(workingTargeting, replacementsToMap(repl))
              : { changed: false };

          if (repl.length > 0 && changed && depAttempt < maxDeprecatedInterestAttempts - 1) {
            for (const r of repl) {
              const label =
                r.deprecatedName && r.alternativeName
                  ? `«${r.deprecatedName}» (id ${r.deprecatedId}) → «${r.alternativeName}» (id ${r.alternativeId})`
                  : `id ${r.deprecatedId} → id ${r.alternativeId}`;
              warnings.push(
                `Interesses Meta: termo descontinuado substituído automaticamente pela alternativa sugerida pela Meta (${label}). Confirma se o público continua adequado.`
              );
            }
            continue;
          }
          throw e;
        }
      }

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
        creativeThumbForRow = imageUrl;
        media = { kind: "video", videoId, thumbnailImageUrl: imageUrl };
      } else {
        const { hash, url: imagePreviewUrl } = await uploadAdImageToAccount({
          actId: unit.actId,
          accessToken: ctx.accessToken,
          fileName: creative.name,
          buffer: file.buffer,
          mimeType: file.mimeType || "image/jpeg",
          fetchImpl,
        });
        if (imagePreviewUrl) creativeThumbForRow = imagePreviewUrl;
        media = { kind: "image", imageHash: hash };
      }

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

      const adIds: string[] = [];
      for (let si = 0; si < counts.adsets; si++) {
        for (let ai = 0; ai < counts.adsPerAdset; ai++) {
          const ad = await graphCreateAd({
            actId: unit.actId,
            accessToken: ctx.accessToken,
            name: `Anúncio ${si + 1}-${ai + 1}`.slice(0, 240),
            adSetId: adSetIds[si]!,
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
              thumb: creativeThumbForRow,
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
      await persistFailedCampanha(ctx, {
        unit,
        creative,
        structureDb,
        error: msg,
        thumb: creativeThumbForRow,
      });
    }

    done += 1;
    await ctx.supabase.from("upload_jobs").update({ done }).eq("id", publishId);
  }

  const okCount = results.filter((r) => r.ok).length;
  const jobStatus: "completed" | "error" = okCount === 0 ? "error" : "completed";
  const finishedAt = new Date().toISOString();
  const errorDetails = buildUploadJobErrorDetails(results, warnings);
  await ctx.supabase
    .from("upload_jobs")
    .update({ status: jobStatus, finished_at: finishedAt, error_details: errorDetails })
    .eq("id", publishId);

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
    thumb?: string;
  }
): Promise<void> {
  const sc = resolveStructureCounts(ctx.payload);
  const adsTotal = sc.adsets * sc.adsPerAdset;
  const thumb = args.thumb?.trim() ?? "";
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
      { id: args.creative.id, name: args.creative.name, type: args.creative.type, thumb },
    ] as unknown as Json,
    errors: [{ id: "publish", message: args.error, adName: args.creative.name }] as unknown as Json,
    meta_ids: null,
  });
}
