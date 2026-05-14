import { describe, expect, it } from "vitest";

import {
  billingEventForOptimization,
  buildTargetingFromPublico,
  budgetMinorUnits,
  defaultBillingEventForOptimizationGoal,
  mapBidStrategyToMeta,
  publicoTargetsDsaRegion,
  resolveStructureCounts,
  selectOptimizationForObjective,
  structureLabelForDb,
  validBillingEventsForOptimizationGoal,
  wizardPublishPayloadSchema,
  adsetAndAdsCountsForWizardShape,
} from "@/lib/meta/map-wizard-to-graph";
import { defaultLifetimeSchedule } from "@/lib/meta/meta-datetime";

const basePayload = {
  selectedAccountIds: ["123"],
  creatives: [{ id: "c1", name: "a.png", type: "image" as const }],
  publishOperationId: "aaaaaaaa-bbbb-4ccc-a000-eeeeeeeeeeee",
  creativeStoragePaths: [
    "00000000-0000-4000-8000-000000000001/aaaaaaaa-bbbb-4ccc-a000-eeeeeeeeeeee/creative_0.png",
  ],
  campaignType: "CBO" as const,
  budget: 12.5,
  budgetPeriod: "daily" as const,
  bidStrategy: "LOWEST_COST" as const,
  objective: "OUTCOME_TRAFFIC",
  pixelId: "",
  status: "PAUSED" as const,
  structure: "1-1-1" as const,
  customStructure: { campaigns: 1, adsets: 1, ads: 1 },
  nomenclaturePreview: "Teste",
  publico: {
    id: "p1",
    name: "Público",
    type: "custom" as const,
    locations: [{ type: "country" as const, key: "PT", name: "Portugal" }],
    ageMin: 21,
    ageMax: 55,
    gender: "all" as const,
    interests: [],
    devices: ["mobile" as const, "desktop" as const],
    platforms: ["facebook" as const],
  },
};

describe("wizardPublishPayloadSchema", () => {
  it("rejects adSetBillingEvent incompatible with derived optimization goal", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      objective: "OUTCOME_TRAFFIC",
      pixelId: "",
      adSetBillingEvent: "THRUPLAY",
    });
    expect(res.success).toBe(false);
  });

  it("accepts adSetBillingEvent IMPRESSIONS for traffic (LINK_CLICKS goal)", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      objective: "OUTCOME_TRAFFIC",
      pixelId: "",
      adSetBillingEvent: "IMPRESSIONS",
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.adSetBillingEvent).toBe("IMPRESSIONS");
  });
  it("parses minimal valid payload", () => {
    const p = wizardPublishPayloadSchema.parse(basePayload);
    expect(p.creatives).toHaveLength(1);
    expect(p.creativeStoragePaths).toHaveLength(1);
    expect(p.antiSpy).toBe(true);
  });

  it("accepts optional primaryText up to 2000 characters", () => {
    const text = "x".repeat(2000);
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      creatives: [{ id: "c1", name: "a.png", type: "image", primaryText: text }],
    });
    expect(p.creatives[0].primaryText).toBe(text);
  });

  it("rejects primaryText longer than 2000 characters", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      creatives: [{ id: "c1", name: "a.png", type: "image", primaryText: "y".repeat(2001) }],
    });
    expect(res.success).toBe(false);
  });

  it("rejects when creativeStoragePaths length mismatches creatives", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      creativeStoragePaths: [
        "00000000-0000-4000-8000-000000000001/uuuuuuuu-uuuu-4uuu-uuuu-uuuuuuuuuuuu/a.png",
        "00000000-0000-4000-8000-000000000001/uuuuuuuu-uuuu-4uuu-uuuu-uuuuuuuuuuuu/b.png",
      ],
    });
    expect(res.success).toBe(false);
  });

  it("rejects paths with traversal segments", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      creativeStoragePaths: ["user/../evil/creative_0.png"],
    });
    expect(res.success).toBe(false);
  });

  it("rejects when storage path folder differs from publishOperationId", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      publishOperationId: "aaaaaaaa-bbbb-4ccc-a000-eeeeeeeeeeee",
      creativeStoragePaths: [
        "00000000-0000-4000-8000-000000000001/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb/creative_0.png",
      ],
    });
    expect(res.success).toBe(false);
  });

  it("defaults campaignSchedule when omitted", () => {
    const p = wizardPublishPayloadSchema.parse(basePayload);
    expect(p.campaignSchedule.flightMode).toBe("automatic");
    expect(p.campaignSchedule.dayparting.enabled).toBe(false);
    expect(p.campaignSchedule.openEndedFlight).toBe(false);
  });

  it("accepts https destinationUrl", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      destinationUrl: "https://landing.example/path",
    });
    expect(p.destinationUrl).toBe("https://landing.example/path");
  });

  it("rejects http destinationUrl", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      destinationUrl: "http://insecure.example/",
    });
    expect(res.success).toBe(false);
  });

  it("rejects creative name longer than 256", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      creatives: [{ id: "c1", name: "x".repeat(257), type: "image" }],
    });
    expect(res.success).toBe(false);
  });

  it("rejects adSetNames when length mismatches structure ad set count", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      structure: "1-3-5",
      adSetNames: ["A", "B"],
    });
    expect(res.success).toBe(false);
  });

  it("accepts adSetNames matching structure ad set count", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      structure: "1-3-5",
      adSetNames: ["Alpha", "Beta", "Gamma"],
    });
    expect(p.adSetNames).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("rejects custom flight with daily budget", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      budgetPeriod: "daily",
      campaignSchedule: {
        flightMode: "custom_dates",
        flightStart: new Date().toISOString(),
        flightEnd: new Date(Date.now() + 86400000 * 2).toISOString(),
        openEndedFlight: false,
        dayparting: { enabled: false, segments: [] },
        frequencyCap: null,
      },
    });
    expect(res.success).toBe(false);
  });

  it("rejects dayparting without lifetime budget", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      budgetPeriod: "daily",
      campaignSchedule: {
        flightMode: "automatic",
        openEndedFlight: false,
        dayparting: { enabled: true, segments: [{ days: [1], startMinute: 100, endMinute: 200 }] },
        frequencyCap: null,
      },
    });
    expect(res.success).toBe(false);
  });

  it("accepts lifetime custom_dates with valid range", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      budgetPeriod: "lifetime",
      campaignSchedule: {
        flightMode: "custom_dates",
        flightStart: new Date().toISOString(),
        flightEnd: new Date(Date.now() + 3 * 86400000).toISOString(),
        openEndedFlight: false,
        dayparting: { enabled: false, segments: [] },
        frequencyCap: null,
      },
    });
    expect(res.success).toBe(true);
  });

  it("accepts daily scheduled start with open-ended flight", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      budgetPeriod: "daily",
      campaignSchedule: {
        flightMode: "automatic",
        flightStart: new Date("2030-06-01T10:00:00.000Z").toISOString(),
        openEndedFlight: true,
        dayparting: { enabled: false, segments: [] },
        frequencyCap: null,
      },
    });
    expect(res.success).toBe(true);
  });

  it("accepts daily scheduled start and end with min 24h window", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      budgetPeriod: "daily",
      campaignSchedule: {
        flightMode: "automatic",
        flightStart: new Date("2030-06-01T10:00:00.000Z").toISOString(),
        flightEnd: new Date("2030-06-03T10:00:00.000Z").toISOString(),
        openEndedFlight: false,
        dayparting: { enabled: false, segments: [] },
        frequencyCap: null,
      },
    });
    expect(res.success).toBe(true);
  });

  it("rejects daily flight end without start", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      budgetPeriod: "daily",
      campaignSchedule: {
        flightMode: "automatic",
        flightEnd: new Date().toISOString(),
        openEndedFlight: false,
        dayparting: { enabled: false, segments: [] },
        frequencyCap: null,
      },
    });
    expect(res.success).toBe(false);
  });

  it("rejects daily flight start without end when not open-ended", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      budgetPeriod: "daily",
      campaignSchedule: {
        flightMode: "automatic",
        flightStart: new Date().toISOString(),
        openEndedFlight: false,
        dayparting: { enabled: false, segments: [] },
        frequencyCap: null,
      },
    });
    expect(res.success).toBe(false);
  });

  it("rejects daily flight window under 24 hours", () => {
    const t0 = new Date("2030-06-01T10:00:00.000Z").toISOString();
    const t1 = new Date("2030-06-01T20:00:00.000Z").toISOString();
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      budgetPeriod: "daily",
      campaignSchedule: {
        flightMode: "automatic",
        flightStart: t0,
        flightEnd: t1,
        openEndedFlight: false,
        dayparting: { enabled: false, segments: [] },
        frequencyCap: null,
      },
    });
    expect(res.success).toBe(false);
  });

  it("rejects open-ended flight flag with lifetime budget", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      budgetPeriod: "lifetime",
      campaignSchedule: {
        flightMode: "automatic",
        openEndedFlight: true,
        dayparting: { enabled: false, segments: [] },
        frequencyCap: null,
      },
    });
    expect(res.success).toBe(false);
  });

  it("rejects dayparting enabled with zero segments", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      budgetPeriod: "lifetime",
      campaignSchedule: {
        flightMode: "automatic",
        openEndedFlight: false,
        dayparting: { enabled: true, segments: [] },
        frequencyCap: null,
      },
    });
    expect(res.success).toBe(false);
  });

  it("accepts publico with country only (ISO2)", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      publico: {
        ...basePayload.publico,
        locations: [{ type: "country", key: "PT", name: "Portugal" }],
      },
    });
    expect(res.success).toBe(true);
  });

  it("accepts publico with sub-national only", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      publico: {
        ...basePayload.publico,
        locations: [{ type: "state", key: "3847", name: "São Paulo" }],
      },
    });
    expect(res.success).toBe(true);
  });

  it("rejects publico mixing ISO country with sub-national", () => {
    const res = wizardPublishPayloadSchema.safeParse({
      ...basePayload,
      publico: {
        ...basePayload.publico,
        locations: [
          { type: "country", key: "BR", name: "Brasil" },
          { type: "city", key: "600000", name: "Campinas" },
        ],
      },
    });
    expect(res.success).toBe(false);
  });
});

describe("resolveStructureCounts", () => {
  it("maps presets", () => {
    const p = wizardPublishPayloadSchema.parse(basePayload);
    expect(resolveStructureCounts(p)).toEqual({ metaCampaigns: 1, adsets: 1, adsPerAdset: 1 });

    const p2 = wizardPublishPayloadSchema.parse({ ...basePayload, structure: "1-3-5" });
    expect(resolveStructureCounts(p2)).toEqual({ metaCampaigns: 1, adsets: 3, adsPerAdset: 5 });
  });

  it("uses customStructure for custom", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      structure: "custom",
      customStructure: { campaigns: 2, adsets: 4, ads: 3 },
    });
    expect(resolveStructureCounts(p)).toEqual({ metaCampaigns: 1, adsets: 4, adsPerAdset: 3 });
  });
});

describe("structureLabelForDb", () => {
  it("maps 1-1-1 to API slug and custom to prefixed string", () => {
    const p1 = wizardPublishPayloadSchema.parse(basePayload);
    expect(structureLabelForDb(p1)).toBe("1-1-5");

    const p2 = wizardPublishPayloadSchema.parse({
      ...basePayload,
      structure: "custom",
      customStructure: { campaigns: 2, adsets: 4, ads: 3 },
    });
    expect(structureLabelForDb(p2)).toBe("custom:2-4-3");
  });
});

describe("buildTargetingFromPublico", () => {
  function expectAdvantageAudience(targeting: Record<string, unknown>) {
    expect(targeting.targeting_automation).toEqual({ advantage_audience: 1 });
  }

  it("uses BR fallback only when locations are empty", () => {
    const publico = {
      ...basePayload.publico,
      locations: [] as typeof basePayload.publico.locations,
    };
    const { targeting, usedFallbackGeo } = buildTargetingFromPublico(publico);
    expect(usedFallbackGeo).toBe(true);
    expect(targeting.geo_locations).toEqual({ countries: ["BR"] });
    expect(targeting.age_min).toBe(21);
    expect(targeting.publisher_platforms).toContain("facebook");
    expect(targeting.device_platforms).toEqual(["mobile", "desktop"]);
    expect(targeting.user_os).toBeUndefined();
    expectAdvantageAudience(targeting);
  });

  it("maps city-only selection without BR fallback", () => {
    const publico = {
      ...basePayload.publico,
      locations: [{ type: "city" as const, key: "2457168", name: "Lisboa" }],
    };
    const { targeting, usedFallbackGeo } = buildTargetingFromPublico(publico);
    expect(usedFallbackGeo).toBe(false);
    expect(targeting.geo_locations).toEqual({ cities: [{ key: "2457168" }] });
    expectAdvantageAudience(targeting);
  });

  it("maps state/region keys into geo_locations.regions", () => {
    const publico = {
      ...basePayload.publico,
      locations: [{ type: "state" as const, key: "3847", name: "São Paulo" }],
    };
    const { targeting, usedFallbackGeo } = buildTargetingFromPublico(publico);
    expect(usedFallbackGeo).toBe(false);
    expect(targeting.geo_locations).toEqual({ regions: [{ key: "3847" }] });
    expectAdvantageAudience(targeting);
  });

  it("dedupes regions and cities from sub-national-only locations", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: {
        ...basePayload.publico,
        locations: [
          { type: "state" as const, key: "3847", name: "SP" },
          { type: "city" as const, key: "600000", name: "Campinas" },
          { type: "state" as const, key: "3847", name: "SP dup" },
        ],
      },
    });
    const { targeting, usedFallbackGeo } = buildTargetingFromPublico(p.publico);
    expect(usedFallbackGeo).toBe(false);
    expect(targeting.geo_locations).toEqual({
      regions: [{ key: "3847" }],
      cities: [{ key: "600000" }],
    });
    expectAdvantageAudience(targeting);
  });

  it("dedupes ISO country codes from country-only locations", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: {
        ...basePayload.publico,
        locations: [
          { type: "country" as const, key: "br", name: "Brasil" },
          { type: "country" as const, key: "BR", name: "Brasil" },
        ],
      },
    });
    const { targeting, usedFallbackGeo } = buildTargetingFromPublico(p.publico);
    expect(usedFallbackGeo).toBe(false);
    expect(targeting.geo_locations).toEqual({
      countries: ["BR"],
    });
    expect(targeting.device_platforms).toEqual(["mobile", "desktop"]);
    expect(targeting.user_os).toBeUndefined();
    expectAdvantageAudience(targeting);
  });

  it("maps mobile-only to device_platforms mobile", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: { ...basePayload.publico, devices: ["mobile"] },
    });
    const { targeting } = buildTargetingFromPublico(p.publico);
    expect(targeting.device_platforms).toEqual(["mobile"]);
    expect(targeting.user_os).toBeUndefined();
    expectAdvantageAudience(targeting);
  });

  it("maps desktop-only to device_platforms desktop", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: { ...basePayload.publico, devices: ["desktop"] },
    });
    const { targeting } = buildTargetingFromPublico(p.publico);
    expect(targeting.device_platforms).toEqual(["desktop"]);
    expect(targeting.user_os).toBeUndefined();
    expectAdvantageAudience(targeting);
  });

  it("omits device_platforms when no devices selected", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: { ...basePayload.publico, devices: [] },
    });
    const { targeting } = buildTargetingFromPublico(p.publico);
    expect(targeting.device_platforms).toBeUndefined();
    expect(targeting.user_os).toBeUndefined();
    expectAdvantageAudience(targeting);
  });

  it("maps interests to flexible_spec with numeric id only (no name)", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: {
        ...basePayload.publico,
        interests: [{ id: "6003139266461", name: "Movies" }],
      },
    });
    const { targeting } = buildTargetingFromPublico(p.publico);
    expect(targeting.flexible_spec).toEqual([{ interests: [{ id: 6003139266461 }] }]);
    expectAdvantageAudience(targeting);
  });

  it("includes targeting_automation when both country geo and interests are set", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: {
        ...basePayload.publico,
        locations: [{ type: "country" as const, key: "PT", name: "Portugal" }],
        interests: [{ id: "6003139266461", name: "Movies" }],
      },
    });
    const { targeting } = buildTargetingFromPublico(p.publico);
    expect(targeting.geo_locations).toEqual({ countries: ["PT"] });
    expect(targeting.flexible_spec).toEqual([{ interests: [{ id: 6003139266461 }] }]);
    expectAdvantageAudience(targeting);
  });
});

describe("budgetMinorUnits", () => {
  it("converts to minor units with floor 100", () => {
    expect(budgetMinorUnits(1)).toBe(100);
    expect(budgetMinorUnits(10)).toBe(1000);
  });
});

describe("mapBidStrategyToMeta", () => {
  it("maps LOWEST_COST", () => {
    expect(mapBidStrategyToMeta("LOWEST_COST")).toEqual({ bid_strategy: "LOWEST_COST_WITHOUT_CAP" });
  });
});

describe("selectOptimizationForObjective", () => {
  it("uses OFFSITE_CONVERSIONS when pixel present for sales", () => {
    const o = selectOptimizationForObjective("OUTCOME_SALES", "123456789");
    expect(o.optimization_goal).toBe("OFFSITE_CONVERSIONS");
    expect(o.promoted_object?.pixel_id).toBe("123456789");
  });

  it("falls back to LINK_CLICKS without pixel", () => {
    const o = selectOptimizationForObjective("OUTCOME_SALES", "");
    expect(o.optimization_goal).toBe("LINK_CLICKS");
    expect(o.promoted_object).toBeUndefined();
  });
});

describe("defaultBillingEventForOptimizationGoal", () => {
  it("prefers specific billing when Meta allows multiple choices", () => {
    expect(defaultBillingEventForOptimizationGoal("LINK_CLICKS")).toBe("LINK_CLICKS");
    expect(defaultBillingEventForOptimizationGoal("THRUPLAY")).toBe("THRUPLAY");
    expect(defaultBillingEventForOptimizationGoal("TWO_SECOND_CONTINUOUS_VIDEO_VIEWS")).toBe(
      "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS"
    );
  });

  it("uses IMPRESSIONS for single-option goals", () => {
    expect(defaultBillingEventForOptimizationGoal("REACH")).toBe("IMPRESSIONS");
    expect(defaultBillingEventForOptimizationGoal("LANDING_PAGE_VIEWS")).toBe("IMPRESSIONS");
    expect(defaultBillingEventForOptimizationGoal("OFFSITE_CONVERSIONS")).toBe("IMPRESSIONS");
    expect(defaultBillingEventForOptimizationGoal("POST_ENGAGEMENT")).toBe("IMPRESSIONS");
    expect(defaultBillingEventForOptimizationGoal("APP_INSTALLS")).toBe("IMPRESSIONS");
  });
});

describe("validBillingEventsForOptimizationGoal", () => {
  it("returns two options for goals with billing choice", () => {
    expect(validBillingEventsForOptimizationGoal("LINK_CLICKS")).toEqual(["LINK_CLICKS", "IMPRESSIONS"]);
    expect(validBillingEventsForOptimizationGoal("THRUPLAY")).toEqual(["THRUPLAY", "IMPRESSIONS"]);
    expect(validBillingEventsForOptimizationGoal("TWO_SECOND_CONTINUOUS_VIDEO_VIEWS")).toEqual([
      "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS",
      "IMPRESSIONS",
    ]);
  });

  it("returns only IMPRESSIONS for other goals including unknown", () => {
    expect(validBillingEventsForOptimizationGoal("REACH")).toEqual(["IMPRESSIONS"]);
    expect(validBillingEventsForOptimizationGoal("UNKNOWN_GOAL_X")).toEqual(["IMPRESSIONS"]);
  });
});

describe("billingEventForOptimization", () => {
  it("delegates to default (alias)", () => {
    expect(billingEventForOptimization("LINK_CLICKS")).toBe(defaultBillingEventForOptimizationGoal("LINK_CLICKS"));
    expect(billingEventForOptimization("REACH")).toBe("IMPRESSIONS");
  });
});

describe("defaultLifetimeSchedule", () => {
  it("returns ISO-like strings with +0000 and end after start", () => {
    const { startTime, endTime } = defaultLifetimeSchedule(7);
    expect(startTime).toMatch(/\+0000$/);
    expect(endTime).toMatch(/\+0000$/);
    const toUtcMs = (s: string) => new Date(s.replace(/\+0000$/, "Z")).getTime();
    expect(toUtcMs(endTime)).toBeGreaterThan(toUtcMs(startTime));
  });
});

describe("publicoTargetsDsaRegion", () => {
  it("is true for EU country keys", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: {
        ...basePayload.publico,
        locations: [{ type: "country", key: "DE", name: "Germany" }],
      },
    });
    expect(publicoTargetsDsaRegion(p.publico)).toBe(true);
  });

  it("is false when no EU country in audience", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: {
        ...basePayload.publico,
        locations: [{ type: "country", key: "BR", name: "Brasil" }],
      },
    });
    expect(publicoTargetsDsaRegion(p.publico)).toBe(false);
  });
});

describe("adsetAndAdsCountsForWizardShape", () => {
  it("matches presets and custom structure", () => {
    expect(adsetAndAdsCountsForWizardShape("1-1-1", { campaigns: 1, adsets: 1, ads: 1 })).toEqual({
      adsets: 1,
      adsPerAdset: 1,
    });
    expect(adsetAndAdsCountsForWizardShape("1-3-5", { campaigns: 1, adsets: 1, ads: 1 })).toEqual({
      adsets: 3,
      adsPerAdset: 5,
    });
    expect(
      adsetAndAdsCountsForWizardShape("custom", { campaigns: 1, adsets: 4, ads: 1 })
    ).toEqual({ adsets: 4, adsPerAdset: 1 });
  });
});
