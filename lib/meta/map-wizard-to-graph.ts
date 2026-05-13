import { z } from "zod";

import type { Structure } from "@/lib/stores/wizardStore";
import { getPublicoGeoValidationErrorPt } from "@/lib/wizard/publico-geo-validation";
import {
  campaignScheduleSchema,
  defaultCampaignSchedule,
} from "@/lib/meta/campaign-schedule";
import {
  validBillingEventsForOptimizationGoal,
  WIZARD_AD_SET_BILLING_EVENTS,
} from "@/lib/meta/billing-event";

export { defaultLifetimeSchedule, type MetaLifetimeWindow } from "@/lib/meta/meta-datetime";

export {
  billingEventForOptimization,
  defaultBillingEventForOptimizationGoal,
  validBillingEventsForOptimizationGoal,
  type BillingEvent,
  type WizardAdSetBillingEvent,
  WIZARD_AD_SET_BILLING_EVENTS,
} from "@/lib/meta/billing-event";

const localidadeSchema = z.object({
  type: z.enum(["country", "state", "region", "city"]),
  key: z.string(),
  name: z.string(),
});

const publicoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["saved", "custom"]),
  locations: z.array(localidadeSchema),
  ageMin: z.number().int(),
  ageMax: z.number().int(),
  gender: z.enum(["all", "male", "female"]),
  interests: z.array(z.object({ id: z.string(), name: z.string() })),
  devices: z.array(z.enum(["mobile", "desktop"])),
  platforms: z.array(z.enum(["facebook", "instagram", "audience_network", "messenger"])),
});

const creativeMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["image", "video"]),
});

const storagePathString = z
  .string()
  .min(1)
  .refine((s) => !s.includes("..") && !s.startsWith("/"), "caminho inválido");

const wizardAdSetBillingEventSchema = z.enum(WIZARD_AD_SET_BILLING_EVENTS);

/** JSON body for `POST /api/wizard/publish` (creatives live in Supabase Storage; paths listed here). */
export const wizardPublishPayloadSchema = z
  .object({
    selectedAccountIds: z.array(z.string().min(1)),
    creatives: z.array(creativeMetaSchema).min(1),
    campaignType: z.enum(["CBO", "ABO", "DPA"]),
    budget: z.number().positive(),
    budgetPeriod: z.enum(["daily", "lifetime"]),
    bidStrategy: z.enum(["LOWEST_COST", "BID_CAP", "COST_CAP", "ROAS"]),
    bidLimit: z.number().optional(),
    roasTarget: z.number().optional(),
    objective: z.string().min(1),
    pixelId: z.string(),
    status: z.enum(["ACTIVE", "PAUSED"]),
    structure: z.enum(["1-1-1", "1-3-5", "1-50-1", "custom"]),
    customStructure: z.object({
      campaigns: z.number().int().positive(),
      adsets: z.number().int().positive(),
      ads: z.number().int().positive(),
    }),
    nomenclaturePreview: z.string(),
    publico: publicoSchema,
    antiSpy: z.boolean().optional().default(true),
    workspaceId: z.string().uuid().nullable().optional(),
    /** Facebook Page ID for object_story_spec — chosen in the wizard; server validates against GET /me/accounts. */
    pageId: z.string().min(1).optional(),
    /** Igual ao 2.º segmento dos `creativeStoragePaths` e ao `upload_jobs.id` criado em POST /api/wizard/publish/init. */
    publishOperationId: z.string().uuid(),
    /** Object paths in bucket `wizard_creatives`, same order as `creatives` (browser upload, server download). */
    creativeStoragePaths: z.array(storagePathString).min(1),
    /** Flight dates, dayparting, frequency caps — applied at creation time only (see `app/api/wizard/publish/route.ts`). */
    campaignSchedule: campaignScheduleSchema.default(() => defaultCampaignSchedule()),
    /** When the derived `optimization_goal` allows multiple billing modes (ex. LINK_CLICKS vs IMPRESSIONS). */
    adSetBillingEvent: wizardAdSetBillingEventSchema.optional(),
  })
  .refine((d) => d.creativeStoragePaths.length === d.creatives.length, {
    message: "creativeStoragePaths deve ter uma entrada por criativo.",
    path: ["creativeStoragePaths"],
  })
  .superRefine((d, ctx) => {
    for (let i = 0; i < d.creativeStoragePaths.length; i++) {
      const segments = d.creativeStoragePaths[i].split("/").filter((s) => s.length > 0);
      if (segments[1] !== d.publishOperationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cada caminho deve usar publishOperationId como pasta da operação.",
          path: ["creativeStoragePaths", i],
        });
      }
    }
    const s = d.campaignSchedule;
    if (s.openEndedFlight && d.budgetPeriod !== "daily") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "«Sem data de fim» só está disponível com orçamento diário. No Meta, orçamento vitalício exige sempre uma data de fim do voo.",
        path: ["campaignSchedule", "openEndedFlight"],
      });
    }
    if (s.flightMode === "custom_dates") {
      if (d.budgetPeriod !== "lifetime") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Datas de voo personalizadas (início e fim) com este modo só estão disponíveis com orçamento vitalício.",
          path: ["campaignSchedule", "flightMode"],
        });
      }
      const a = s.flightStart?.trim() ?? "";
      const b = s.flightEnd?.trim() ?? "";
      if (!a || !b) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica início e fim do voo (ISO 8601). No Meta, o orçamento vitalício exige ambas as datas.",
          path: ["campaignSchedule", "flightStart"],
        });
      } else {
        const t0 = Date.parse(a);
        const t1 = Date.parse(b);
        if (Number.isNaN(t0) || Number.isNaN(t1)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Datas inválidas.",
            path: ["campaignSchedule", "flightStart"],
          });
        } else if (t1 <= t0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A data de fim deve ser depois da data de início.",
            path: ["campaignSchedule", "flightEnd"],
          });
        } else if (t1 - t0 < 24 * 60 * 60 * 1000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O voo deve durar pelo menos 24 horas.",
            path: ["campaignSchedule", "flightEnd"],
          });
        }
      }
    }
    if (d.budgetPeriod === "daily") {
      const start = s.flightStart?.trim() ?? "";
      const end = s.flightEnd?.trim() ?? "";
      if (end && !start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica a data de início do voo quando defines uma data de fim.",
          path: ["campaignSchedule", "flightStart"],
        });
      }
      if (start) {
        const t0 = Date.parse(start);
        if (Number.isNaN(t0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Data de início inválida.",
            path: ["campaignSchedule", "flightStart"],
          });
        } else if (s.openEndedFlight) {
          /* ok: Meta uses end_time=0 */
        } else if (!end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Indica a data de fim do voo ou activa «Sem data de fim» (recomendado para campanhas contínuas com orçamento diário).",
            path: ["campaignSchedule", "flightEnd"],
          });
        } else {
          const t1 = Date.parse(end);
          if (Number.isNaN(t1)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Data de fim inválida.",
              path: ["campaignSchedule", "flightEnd"],
            });
          } else if (t1 <= t0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "A data de fim deve ser depois da data de início.",
              path: ["campaignSchedule", "flightEnd"],
            });
          } else if (t1 - t0 < 24 * 60 * 60 * 1000) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "O voo deve durar pelo menos 24 horas (requisito do Meta para orçamento diário com janela).",
              path: ["campaignSchedule", "flightEnd"],
            });
          }
        }
      }
    }
    if (s.dayparting.enabled) {
      if (d.budgetPeriod !== "lifetime") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dayparting (horas/dias) requer orçamento vitalício, conforme o Marketing API.",
          path: ["campaignSchedule", "dayparting", "enabled"],
        });
      }
      if (s.dayparting.segments.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Com dayparting ativo, define pelo menos um intervalo (dias e horas).",
          path: ["campaignSchedule", "dayparting", "segments"],
        });
      }
    }
    const geoErr = getPublicoGeoValidationErrorPt(d.publico);
    if (geoErr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: geoErr,
        path: ["publico", "locations"],
      });
    }
    if (d.adSetBillingEvent != null) {
      const optGoal = selectOptimizationForObjective(d.objective, d.pixelId).optimization_goal;
      const allowed = validBillingEventsForOptimizationGoal(optGoal);
      if (!allowed.includes(d.adSetBillingEvent)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "adSetBillingEvent não é válido para o optimization_goal deste objetivo.",
          path: ["adSetBillingEvent"],
        });
      }
    }
  });

export type WizardPublishPayload = z.infer<typeof wizardPublishPayloadSchema>;

/** Client-side wizard state before init + storage upload (sem `publishOperationId` nem paths). */
export type WizardPublishPayloadInput = Omit<WizardPublishPayload, "creativeStoragePaths" | "publishOperationId">;

export type StructureCounts = {
  /** Meta campaigns we create per account×creative (always 1 per publish unit in MVP) */
  metaCampaigns: 1;
  adsets: number;
  adsPerAdset: number;
};

const PRESET_COUNTS: Record<Exclude<Structure, "custom">, Pick<StructureCounts, "adsets" | "adsPerAdset">> = {
  "1-1-1": { adsets: 1, adsPerAdset: 1 },
  "1-3-5": { adsets: 3, adsPerAdset: 5 },
  "1-50-1": { adsets: 50, adsPerAdset: 1 },
};

export function resolveStructureCounts(payload: WizardPublishPayload): StructureCounts {
  if (payload.structure === "custom") {
    const c = payload.customStructure;
    return { metaCampaigns: 1, adsets: c.adsets, adsPerAdset: c.ads };
  }
  const p = PRESET_COUNTS[payload.structure];
  return { metaCampaigns: 1, adsets: p.adsets, adsPerAdset: p.adsPerAdset };
}

/** Store in campanhas.structure: presets map to API-friendly slug; custom keeps counts */
export function structureLabelForDb(payload: WizardPublishPayload, counts: StructureCounts): string {
  if (payload.structure === "custom") {
    const c = payload.customStructure;
    return `custom:${c.campaigns}-${c.adsets}-${c.ads}`;
  }
  if (payload.structure === "1-1-1") return "1-1-5";
  return payload.structure;
}

export type TargetingBuildResult = {
  targeting: Record<string, unknown>;
  usedFallbackGeo: boolean;
  fallbackCountry?: string;
};

function mapGender(g: WizardPublishPayload["publico"]["gender"]): number[] {
  if (g === "male") return [1];
  if (g === "female") return [2];
  return [1, 2];
}

function mapPublisherPlatforms(platforms: WizardPublishPayload["publico"]["platforms"]): string[] {
  const map: Record<string, string> = {
    facebook: "facebook",
    instagram: "instagram",
    audience_network: "audience_network",
    messenger: "messenger",
  };
  const out = new Set<string>();
  for (const p of platforms) {
    const m = map[p];
    if (m) out.add(m);
  }
  if (out.size === 0) {
    out.add("facebook");
    out.add("instagram");
  }
  return Array.from(out);
}

/**
 * Builds Marketing API `targeting` object (subset).
 * Partitions `geo_locations` into countries, regions (state/region), and cities.
 * Uses BR as fallback only when all three are empty.
 */
export function buildTargetingFromPublico(publico: WizardPublishPayload["publico"]): TargetingBuildResult {
  const countries: string[] = [];
  const regions: Array<{ key: string }> = [];
  const cities: Array<{ key: string }> = [];
  for (const loc of publico.locations) {
    const key = loc.key?.trim() ?? "";
    if (!key) continue;
    if (loc.type === "country" && key.length === 2) {
      countries.push(key.toUpperCase());
    } else if (loc.type === "state" || loc.type === "region") {
      regions.push({ key });
    } else if (loc.type === "city") {
      cities.push({ key });
    }
  }
  const effectiveCountries = Array.from(new Set(countries));
  const dedupeGeo = <T extends { key: string }>(items: T[]) => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of items) {
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      out.push(item);
    }
    return out;
  };
  const effectiveRegions = dedupeGeo(regions);
  const effectiveCities = dedupeGeo(cities);

  let usedFallbackGeo = false;
  let fallbackCountry: string | undefined;
  const hasGeo = effectiveCountries.length > 0 || effectiveRegions.length > 0 || effectiveCities.length > 0;
  const finalCountries =
    effectiveCountries.length > 0
      ? effectiveCountries
      : !hasGeo
        ? (() => {
            usedFallbackGeo = true;
            fallbackCountry = "BR";
            return ["BR"];
          })()
        : [];

  // Meta rejects geo_locations that combine `countries` with `cities`/`regions`.
  // When sub-national locations exist, omit countries — the keys already imply country.
  const hasSubNational = effectiveRegions.length > 0 || effectiveCities.length > 0;
  const geo_locations: Record<string, unknown> = {};
  if (!hasSubNational && finalCountries.length > 0) geo_locations.countries = finalCountries;
  if (effectiveRegions.length > 0) geo_locations.regions = effectiveRegions;
  if (effectiveCities.length > 0) geo_locations.cities = effectiveCities;

  const targeting: Record<string, unknown> = {
    geo_locations,
    age_min: Math.max(13, Math.min(publico.ageMin, publico.ageMax)),
    age_max: Math.max(13, Math.max(publico.ageMin, publico.ageMax)),
    genders: mapGender(publico.gender),
    publisher_platforms: mapPublisherPlatforms(publico.platforms),
  };

  if (publico.interests.length > 0) {
    const interestRows = publico.interests
      .map((i) => {
        const raw = i.id?.trim() ?? "";
        if (!raw) return null;
        if (/^\d+$/.test(raw)) {
          return { id: Number(raw) };
        }
        return { id: raw };
      })
      .filter((row): row is { id: number } | { id: string } => row != null);
    if (interestRows.length > 0) {
      targeting.flexible_spec = [{ interests: interestRows }];
    }
  }

  const devicePlatforms: string[] = [];
  if (publico.devices.includes("mobile")) devicePlatforms.push("mobile");
  if (publico.devices.includes("desktop")) devicePlatforms.push("desktop");
  if (devicePlatforms.length > 0) {
    targeting.device_platforms = devicePlatforms;
  }

  // Marketing API v23+: ad set targeting that is not Meta's strict "default" or "relaxed" setup must
  // set `advantage_audience` explicitly (0 or 1); we opt in to 1 — Meta's default for new ad sets.
  targeting.targeting_automation = { advantage_audience: 1 };

  return { targeting, usedFallbackGeo, fallbackCountry };
}

export function budgetMinorUnits(budget: number): number {
  const cents = Math.round(budget * 100);
  return Math.max(cents, 100);
}

/** EU/EEA (+ UK) ISO2 — used for optional DSA fields on ad sets. */
const DSA_COUNTRY_CODES = new Set(
  [
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "DE",
    "GR",
    "HU",
    "IE",
    "IT",
    "LV",
    "LT",
    "LU",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SK",
    "SI",
    "ES",
    "SE",
    "IS",
    "LI",
    "NO",
    "GB",
  ].map((c) => c.toUpperCase())
);

export function publicoTargetsDsaRegion(publico: WizardPublishPayload["publico"]): boolean {
  for (const loc of publico.locations) {
    if (loc.type === "country" && loc.key.length === 2 && DSA_COUNTRY_CODES.has(loc.key.toUpperCase())) {
      return true;
    }
  }
  return false;
}

export function mapBidStrategyToMeta(
  bidStrategy: WizardPublishPayload["bidStrategy"],
  bidLimit?: number
): { bid_strategy: string; bid_amount?: string } {
  switch (bidStrategy) {
    case "BID_CAP":
      return bidLimit != null && bidLimit > 0
        ? { bid_strategy: "LOWEST_COST_WITH_BID_CAP", bid_amount: String(Math.round(bidLimit * 100)) }
        : { bid_strategy: "LOWEST_COST_WITHOUT_CAP" };
    case "COST_CAP":
      return bidLimit != null && bidLimit > 0
        ? { bid_strategy: "COST_CAP", bid_amount: String(Math.round(bidLimit * 100)) }
        : { bid_strategy: "LOWEST_COST_WITHOUT_CAP" };
    case "ROAS":
      return { bid_strategy: "LOWEST_COST_WITHOUT_CAP" };
    default:
      return { bid_strategy: "LOWEST_COST_WITHOUT_CAP" };
  }
}

export type OptimizationBundle = {
  optimization_goal: string;
  promoted_object?: Record<string, string>;
};

export function selectOptimizationForObjective(
  objective: string,
  pixelId: string
): OptimizationBundle {
  const pixel = pixelId.trim();
  if ((objective === "OUTCOME_SALES" || objective === "OUTCOME_LEADS") && pixel) {
    const event = objective === "OUTCOME_LEADS" ? "LEAD" : "PURCHASE";
    return {
      optimization_goal: "OFFSITE_CONVERSIONS",
      promoted_object: { pixel_id: pixel, custom_event_type: event },
    };
  }
  if (objective === "OUTCOME_TRAFFIC") {
    return { optimization_goal: "LINK_CLICKS" };
  }
  if (objective === "OUTCOME_AWARENESS") {
    return { optimization_goal: "REACH" };
  }
  if (objective === "OUTCOME_ENGAGEMENT") {
    return { optimization_goal: "POST_ENGAGEMENT" };
  }
  if (objective === "OUTCOME_APP_PROMOTION") {
    return { optimization_goal: "APP_INSTALLS" };
  }
  return { optimization_goal: "LINK_CLICKS" };
}
