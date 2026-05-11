import { describe, expect, it } from "vitest";

import {
  buildTargetingFromPublico,
  budgetMinorUnits,
  mapBidStrategyToMeta,
  resolveStructureCounts,
  selectOptimizationForObjective,
  structureLabelForDb,
  wizardPublishPayloadSchema,
} from "@/lib/meta/map-wizard-to-graph";

const basePayload = {
  selectedAccountIds: ["123"],
  creatives: [{ id: "c1", name: "a.png", type: "image" as const }],
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
    expect(p.antiSpy).toBe(true);
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
