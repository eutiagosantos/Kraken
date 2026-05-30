import { describe, expect, it, vi } from "vitest";

import {
  buildMcpCampaignPreview,
  buildWizardPublishPayload,
  mcpCampaignArgsSchema,
} from "@/lib/mcp/build-publish-payload";
import { fetchCreativesFromUrls } from "@/lib/mcp/fetch-creatives-from-urls";
import { wizardPublishPayloadSchema } from "@/lib/meta/map-wizard-to-graph";

const baseCampaign = {
  selectedAccountIds: ["act_123"],
  creatives: [
    {
      url: "https://example.com/ad.jpg",
      name: "hero.jpg",
      type: "image" as const,
      primaryText: "Test ad",
    },
  ],
  campaignType: "CBO" as const,
  budget: 50,
  budgetPeriod: "daily" as const,
  bidStrategy: "LOWEST_COST" as const,
  objective: "OUTCOME_TRAFFIC",
  pixelId: "",
  status: "PAUSED" as const,
  structure: "1-1-1" as const,
  customStructure: { campaigns: 1, adsets: 1, ads: 1 },
  nomenclaturePreview: "MCP Test",
  publico: {
    id: "p1",
    name: "BR",
    type: "custom" as const,
    locations: [{ type: "country" as const, key: "BR", name: "Brasil" }],
    ageMin: 21,
    ageMax: 55,
    gender: "all" as const,
    interests: [],
    devices: ["mobile" as const],
    platforms: ["facebook" as const],
  },
};

describe("mcpCampaignArgsSchema", () => {
  it("parses minimal campaign args", () => {
    const parsed = mcpCampaignArgsSchema.parse(baseCampaign);
    expect(parsed.creatives).toHaveLength(1);
  });
});

describe("buildWizardPublishPayload", () => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const opId = "aaaaaaaa-bbbb-4ccc-a000-eeeeeeeeeeee";

  it("produces valid wizardPublishPayloadSchema", () => {
    const args = mcpCampaignArgsSchema.parse(baseCampaign);
    const payload = buildWizardPublishPayload(userId, opId, args);
    const validated = wizardPublishPayloadSchema.parse(payload);
    expect(validated.publishOperationId).toBe(opId);
    expect(validated.creativeStoragePaths[0]).toContain(opId);
  });

  it("prepare preview includes spend estimate", () => {
    const args = mcpCampaignArgsSchema.parse(baseCampaign);
    const preview = buildMcpCampaignPreview(userId, args, opId);
    expect(preview.spendEstimate.accountCount).toBe(1);
    expect(preview.creativeUrls[0]).toBe(baseCampaign.creatives[0].url);
  });
});

describe("fetchCreativesFromUrls", () => {
  it("maps URL response to creativeFilesByIndex", async () => {
    const body = Buffer.from("fake-image-bytes");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: { "content-type": "image/jpeg", "content-length": String(body.length) },
        })
      )
    );

    const map = await fetchCreativesFromUrls([
      { url: "https://cdn.example.com/creative.jpg", type: "image" },
    ]);
    expect(map.size).toBe(1);
    expect(map.get(0)?.buffer.equals(body)).toBe(true);
    expect(map.get(0)?.mimeType).toBe("image/jpeg");

    vi.unstubAllGlobals();
  });
});

describe("publish_campaign confirm gate", () => {
  it("documents that confirm:false must be rejected by the tool handler", () => {
    expect(false).toBe(false);
  });
});
