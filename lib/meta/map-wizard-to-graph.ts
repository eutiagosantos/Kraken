import { z } from "zod";

import type { Structure } from "@/lib/stores/wizardStore";

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
 * If no country locations, uses BR as documented fallback and sets usedFallbackGeo.
 */
export function buildTargetingFromPublico(publico: WizardPublishPayload["publico"]): TargetingBuildResult {
  const countries: string[] = [];
  for (const loc of publico.locations) {
    if (loc.type === "country" && loc.key.length === 2) {
      countries.push(loc.key.toUpperCase());
    }
  }
  let usedFallbackGeo = false;
  let fallbackCountry: string | undefined;
  const effectiveCountries = countries.length > 0 ? Array.from(new Set(countries)) : (() => {
    usedFallbackGeo = true;
    fallbackCountry = "BR";
    return ["BR"];
  })();

  const targeting: Record<string, unknown> = {
    geo_locations: { countries: effectiveCountries },
    age_min: Math.max(13, Math.min(publico.ageMin, publico.ageMax)),
    age_max: Math.max(13, Math.max(publico.ageMin, publico.ageMax)),
    genders: mapGender(publico.gender),
    publisher_platforms: mapPublisherPlatforms(publico.platforms),
  };

  if (publico.interests.length > 0) {
    targeting.flexible_spec = [
      {
        interests: publico.interests.map((i) => ({ id: i.id, name: i.name })),
      },
    ];
  }

  const userOs: string[] = [];
  if (publico.devices.includes("mobile")) userOs.push("Android", "iOS");
  if (publico.devices.includes("desktop")) userOs.push("Windows", "Mac OS X");
  if (userOs.length > 0) {
    targeting.user_os = Array.from(new Set(userOs));
  }

  return { targeting, usedFallbackGeo, fallbackCountry };
}

export function budgetMinorUnits(budget: number): number {
  const cents = Math.round(budget * 100);
  return Math.max(cents, 100);
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
