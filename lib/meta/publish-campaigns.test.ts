import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { wizardPublishPayloadSchema } from "@/lib/meta/map-wizard-to-graph";
import { runWizardPublish } from "@/lib/meta/publish-campaigns";
import type { Database } from "@/lib/supabase/types";

const publicoFixture = {
  id: "p1",
  name: "Público",
  type: "custom" as const,
  locations: [{ type: "country" as const, key: "BR", name: "Brasil" }],
  ageMin: 18,
  ageMax: 65,
  gender: "all" as const,
  interests: [] as { id: string; name: string }[],
  devices: ["mobile" as const],
  platforms: ["facebook" as const],
};

function createSupabaseMock() {
  const insertCampanhas = vi.fn((row: Record<string, unknown>) => {
    if (row.status === "erro") {
      return Promise.resolve({ error: null });
    }
    return {
      select: () => ({
        single: async () => ({ data: { id: "camp-row-id" }, error: null }),
      }),
    };
  });

  const from = vi.fn((table: string) => {
    if (table === "upload_jobs") {
      return {
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: "job-1" }, error: null }),
          }),
        }),
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      };
    }
    if (table === "campanhas") {
      return {
        insert: insertCampanhas,
      };
    }
    if (table === "activity_events") {
      return {
        insert: async () => ({ error: null }),
      };
    }
    return {};
  });

  return { from } as unknown as SupabaseClient<Database>;
}

function graphFetchOk() {
  return vi.fn(async (url: string) => {
    if (url.includes("/adimages")) {
      return new Response(JSON.stringify({ images: { f: { hash: "img_hash" } } }), { status: 200 });
    }
    if (url.includes("/campaigns")) {
      return new Response(JSON.stringify({ id: "meta-camp-1" }), { status: 200 });
    }
    if (url.includes("/adcreatives")) {
      return new Response(JSON.stringify({ id: "meta-cr-1" }), { status: 200 });
    }
    if (url.includes("/adsets")) {
      return new Response(JSON.stringify({ id: "meta-as-1" }), { status: 200 });
    }
    if (url.includes("/ads") && !url.includes("adset")) {
      return new Response(JSON.stringify({ id: "meta-ad-1" }), { status: 200 });
    }
    return new Response("unexpected", { status: 500 });
  });
}

describe("runWizardPublish", () => {
  it("returns publishId and ok result when Graph and DB succeed", async () => {
    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "a.png", type: "image" }],
      creativeStoragePaths: [
        "00000000-0000-4000-8000-000000000001/aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee/creative_0.png",
      ],
      campaignType: "CBO",
      budget: 15,
      budgetPeriod: "daily",
      bidStrategy: "LOWEST_COST",
      objective: "OUTCOME_TRAFFIC",
      pixelId: "",
      status: "PAUSED",
      structure: "1-1-1",
      customStructure: { campaigns: 1, adsets: 1, ads: 1 },
      nomenclaturePreview: "N",
      publico: publicoFixture,
    });

    const out = await runWizardPublish({
      supabase: createSupabaseMock(),
      userId: "user-1",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map([[0, { buffer: Buffer.from([1, 2, 3]), mimeType: "image/png" }]]),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      fetchImpl: graphFetchOk(),
    });

    expect(out.publishId).toBe("job-1");
    expect(out.results).toHaveLength(1);
    expect(out.results[0].ok).toBe(true);
    expect(out.results[0].metaCampaignId).toBe("meta-camp-1");
    expect(out.results[0].krakenCampanhaId).toBe("camp-row-id");
    expect(out.warnings.length).toBe(0);
  });

  it("marks error when image file is missing", async () => {
    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "a.png", type: "image" }],
      creativeStoragePaths: [
        "00000000-0000-4000-8000-000000000001/bbbbbbbb-bbbb-4ccc-dddd-eeeeeeeeeeee/creative_0.png",
      ],
      campaignType: "ABO",
      budget: 20,
      budgetPeriod: "daily",
      bidStrategy: "LOWEST_COST",
      objective: "OUTCOME_TRAFFIC",
      pixelId: "",
      status: "PAUSED",
      structure: "1-1-1",
      customStructure: { campaigns: 1, adsets: 1, ads: 1 },
      nomenclaturePreview: "N",
      publico: publicoFixture,
    });

    const fetchImpl = graphFetchOk();
    const out = await runWizardPublish({
      supabase: createSupabaseMock(),
      userId: "user-1",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map(),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      fetchImpl,
    });

    expect(out.results[0].ok).toBe(false);
    expect(out.results[0].error).toMatch(/Ficheiro/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
