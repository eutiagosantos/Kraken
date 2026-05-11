import { describe, expect, it } from "vitest";

import {
  billingEventForOptimization,
  buildTargetingFromPublico,
  budgetMinorUnits,
  defaultLifetimeSchedule,
  mapBidStrategyToMeta,
  publicoTargetsDsaRegion,
  resolveStructureCounts,
  selectOptimizationForObjective,
  structureLabelForDb,
  wizardPublishPayloadSchema,
} from "@/lib/meta/map-wizard-to-graph";

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
  it("parses minimal valid payload", () => {
    const p = wizardPublishPayloadSchema.parse(basePayload);
    expect(p.creatives).toHaveLength(1);
    expect(p.creativeStoragePaths).toHaveLength(1);
    expect(p.antiSpy).toBe(true);
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
    const c1 = resolveStructureCounts(p1);
    expect(structureLabelForDb(p1, c1)).toBe("1-1-5");

    const p2 = wizardPublishPayloadSchema.parse({
      ...basePayload,
      structure: "custom",
      customStructure: { campaigns: 2, adsets: 4, ads: 3 },
    });
    const c2 = resolveStructureCounts(p2);
    expect(structureLabelForDb(p2, c2)).toBe("custom:2-4-3");
  });
});

describe("buildTargetingFromPublico", () => {
  it("uses BR fallback when no country keys", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: {
        ...basePayload.publico,
        locations: [{ type: "city" as const, key: "lisboa", name: "Lisboa" }],
      },
    });
    const { targeting, usedFallbackGeo } = buildTargetingFromPublico(p.publico);
    expect(usedFallbackGeo).toBe(true);
    expect(targeting.geo_locations).toEqual({ countries: ["BR"] });
    expect(targeting.age_min).toBe(21);
    expect(targeting.publisher_platforms).toContain("facebook");
  });

  it("dedupes countries from locations", () => {
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
    expect(targeting.geo_locations).toEqual({ countries: ["BR"] });
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

describe("billingEventForOptimization", () => {
  it("uses LINK_CLICKS for link click goals", () => {
    expect(billingEventForOptimization("LINK_CLICKS")).toBe("LINK_CLICKS");
    expect(billingEventForOptimization("LANDING_PAGE_VIEWS")).toBe("LINK_CLICKS");
  });

  it("uses IMPRESSIONS for reach and conversions-style goals", () => {
    expect(billingEventForOptimization("REACH")).toBe("IMPRESSIONS");
    expect(billingEventForOptimization("OFFSITE_CONVERSIONS")).toBe("IMPRESSIONS");
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
      publico: { ...basePayload.publico, locations: [{ type: "country", key: "DE", name: "Germany" }] },
    });
    expect(publicoTargetsDsaRegion(p.publico)).toBe(true);
  });

  it("is false when no EU country in audience", () => {
    const p = wizardPublishPayloadSchema.parse({
      ...basePayload,
      publico: { ...basePayload.publico, locations: [{ type: "country", key: "BR", name: "Brasil" }] },
    });
    expect(publicoTargetsDsaRegion(p.publico)).toBe(false);
  });
});
