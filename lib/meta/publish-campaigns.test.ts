import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { wizardPublishPayloadSchema } from "@/lib/meta/map-wizard-to-graph";
import { runWizardPublish } from "@/lib/meta/publish-campaigns";
import type { Database } from "@/lib/supabase/types";

const publicoFixture = {
  id: "p1",
  name: "Público",
  type: "custom" as const,
  locations: [
    { type: "country" as const, key: "BR", name: "Brasil" },
    { type: "state" as const, key: "3847", name: "São Paulo" },
  ],
  ageMin: 18,
  ageMax: 65,
  gender: "all" as const,
  interests: [] as { id: string; name: string }[],
  devices: ["mobile" as const],
  platforms: ["facebook" as const],
};

const PUBLISH_JOB_ID = "aaaaaaaa-bbbb-4ccc-a000-eeeeeeeeeeee";

function requestUrl(input: Parameters<typeof fetch>[0]) {
  return typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
}

function createSupabaseMock() {
  const uploadJobUpdatePayloads: Record<string, unknown>[] = [];
  const insertCampanhaRows: Record<string, unknown>[] = [];

  const insertCampanhas = vi.fn((row: Record<string, unknown>) => {
    insertCampanhaRows.push(row);
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
        update: (payload: Record<string, unknown>) => {
          uploadJobUpdatePayloads.push(payload);
          if ("summary" in payload && payload.status === "processing") {
            return {
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    single: async () => ({ data: { id: PUBLISH_JOB_ID }, error: null }),
                  }),
                }),
              }),
            };
          }
          return {
            eq: async () => ({ error: null }),
          };
        },
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

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    uploadJobUpdatePayloads,
    insertCampanhaRows,
  };
}

function graphFetchOk() {
  const fetchImpl: typeof fetch = vi.fn(async (input) => {
    const url = requestUrl(input);
    if (url.includes("/adimages")) {
      return new Response(
        JSON.stringify({ images: { f: { hash: "img_hash", url: "https://cdn.example/preview.png" } } }),
        { status: 200 }
      );
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
  return fetchImpl;
}

describe("runWizardPublish", () => {
  it("returns publishId and ok result when Graph and DB succeed", async () => {
    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "a.png", type: "image" }],
      publishOperationId: PUBLISH_JOB_ID,
      creativeStoragePaths: [
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_0.png`,
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

    const { supabase, uploadJobUpdatePayloads, insertCampanhaRows } = createSupabaseMock();
    const out = await runWizardPublish({
      supabase,
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map([[0, { buffer: Buffer.from([1, 2, 3]), mimeType: "image/png" }]]),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      existingPublishJobId: PUBLISH_JOB_ID,
      fetchImpl: graphFetchOk(),
    });

    expect(out.publishId).toBe(PUBLISH_JOB_ID);
    expect(out.results).toHaveLength(1);
    expect(out.results[0].ok).toBe(true);
    expect(out.results[0].metaCampaignId).toBe("meta-camp-1");
    expect(out.results[0].krakenCampanhaId).toBe("camp-row-id");
    expect(out.warnings.length).toBe(0);

    const firstJobUpdate = uploadJobUpdatePayloads.find((p) => p.summary != null);
    expect(firstJobUpdate?.status).toBe("processing");
    expect(firstJobUpdate?.summary).toMatchObject({ v: 1, objective: "OUTCOME_TRAFFIC" });
    const lastJobUpdate = uploadJobUpdatePayloads[uploadJobUpdatePayloads.length - 1];
    expect(lastJobUpdate?.finished_at).toEqual(expect.any(String));
    expect(lastJobUpdate?.status).toBe("completed");
    expect(lastJobUpdate?.error_details).toBeNull();

    const concluida = insertCampanhaRows.find((r) => r.status === "concluida");
    const imageCreatives = concluida?.creatives as Array<{ thumb?: string }> | undefined;
    expect(imageCreatives?.[0]?.thumb).toBe("https://cdn.example/preview.png");
  });

  it("CBO LOWEST_COST: sends bid_strategy on campaign, omits bid fields on ad set", async () => {
    const campaignBodies: Record<string, unknown>[] = [];
    const adsetBodies: Record<string, unknown>[] = [];

    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
      const url = requestUrl(input);
      if (url.includes("/adimages")) {
        return new Response(
          JSON.stringify({ images: { f: { hash: "img_hash", url: "https://cdn.example/preview.png" } } }),
          { status: 200 }
        );
      }
      if (url.includes("/campaigns") && init?.method === "POST") {
        campaignBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify({ id: "meta-camp-bid" }), { status: 200 });
      }
      if (url.includes("/adcreatives")) {
        return new Response(JSON.stringify({ id: "meta-cr-1" }), { status: 200 });
      }
      if (url.includes("/adsets") && init?.method === "POST") {
        adsetBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify({ id: "meta-as-1" }), { status: 200 });
      }
      if (url.includes("/ads") && !url.includes("adset")) {
        return new Response(JSON.stringify({ id: "meta-ad-1" }), { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });

    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "a.png", type: "image" }],
      publishOperationId: PUBLISH_JOB_ID,
      creativeStoragePaths: [
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_0.png`,
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

    const { supabase } = createSupabaseMock();
    await runWizardPublish({
      supabase,
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map([[0, { buffer: Buffer.from([1, 2, 3]), mimeType: "image/png" }]]),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      existingPublishJobId: PUBLISH_JOB_ID,
      fetchImpl,
    });

    expect(campaignBodies).toHaveLength(1);
    expect(campaignBodies[0]?.bid_strategy).toBe("LOWEST_COST_WITHOUT_CAP");
    expect(adsetBodies).toHaveLength(1);
    expect(adsetBodies[0]).not.toHaveProperty("bid_strategy");
    expect(adsetBodies[0]).not.toHaveProperty("bid_amount");
  });

  it("CBO BID_CAP with bidLimit: bid_strategy on campaign, bid_amount only on ad set", async () => {
    const campaignBodies: Record<string, unknown>[] = [];
    const adsetBodies: Record<string, unknown>[] = [];

    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
      const url = requestUrl(input);
      if (url.includes("/adimages")) {
        return new Response(
          JSON.stringify({ images: { f: { hash: "img_hash", url: "https://cdn.example/preview.png" } } }),
          { status: 200 }
        );
      }
      if (url.includes("/campaigns") && init?.method === "POST") {
        campaignBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify({ id: "meta-camp-cap" }), { status: 200 });
      }
      if (url.includes("/adcreatives")) {
        return new Response(JSON.stringify({ id: "meta-cr-1" }), { status: 200 });
      }
      if (url.includes("/adsets") && init?.method === "POST") {
        adsetBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify({ id: "meta-as-1" }), { status: 200 });
      }
      if (url.includes("/ads") && !url.includes("adset")) {
        return new Response(JSON.stringify({ id: "meta-ad-1" }), { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });

    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "a.png", type: "image" }],
      publishOperationId: PUBLISH_JOB_ID,
      creativeStoragePaths: [
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_0.png`,
      ],
      campaignType: "CBO",
      budget: 15,
      budgetPeriod: "daily",
      bidStrategy: "BID_CAP",
      bidLimit: 2.5,
      objective: "OUTCOME_TRAFFIC",
      pixelId: "",
      status: "PAUSED",
      structure: "1-1-1",
      customStructure: { campaigns: 1, adsets: 1, ads: 1 },
      nomenclaturePreview: "N",
      publico: publicoFixture,
    });

    const { supabase } = createSupabaseMock();
    await runWizardPublish({
      supabase,
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map([[0, { buffer: Buffer.from([1, 2, 3]), mimeType: "image/png" }]]),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      existingPublishJobId: PUBLISH_JOB_ID,
      fetchImpl,
    });

    expect(campaignBodies[0]?.bid_strategy).toBe("LOWEST_COST_WITH_BID_CAP");
    expect(adsetBodies[0]).not.toHaveProperty("bid_strategy");
    expect(adsetBodies[0]?.bid_amount).toBe("250");
  });

  it("ABO LOWEST_COST: bid_strategy on ad set, not on campaign", async () => {
    const campaignBodies: Record<string, unknown>[] = [];
    const adsetBodies: Record<string, unknown>[] = [];

    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
      const url = requestUrl(input);
      if (url.includes("/adimages")) {
        return new Response(
          JSON.stringify({ images: { f: { hash: "img_hash", url: "https://cdn.example/preview.png" } } }),
          { status: 200 }
        );
      }
      if (url.includes("/campaigns") && init?.method === "POST") {
        campaignBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify({ id: "meta-camp-abo" }), { status: 200 });
      }
      if (url.includes("/adcreatives")) {
        return new Response(JSON.stringify({ id: "meta-cr-1" }), { status: 200 });
      }
      if (url.includes("/adsets") && init?.method === "POST") {
        adsetBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify({ id: "meta-as-1" }), { status: 200 });
      }
      if (url.includes("/ads") && !url.includes("adset")) {
        return new Response(JSON.stringify({ id: "meta-ad-1" }), { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });

    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "a.png", type: "image" }],
      publishOperationId: PUBLISH_JOB_ID,
      creativeStoragePaths: [
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_0.png`,
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

    const { supabase } = createSupabaseMock();
    await runWizardPublish({
      supabase,
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map([[0, { buffer: Buffer.from([1, 2, 3]), mimeType: "image/png" }]]),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      existingPublishJobId: PUBLISH_JOB_ID,
      fetchImpl,
    });

    expect(campaignBodies[0]).not.toHaveProperty("bid_strategy");
    expect(adsetBodies[0]?.bid_strategy).toBe("LOWEST_COST_WITHOUT_CAP");
    expect(adsetBodies[0]).not.toHaveProperty("bid_amount");
  });

  it("marks error when image file is missing", async () => {
    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "a.png", type: "image" }],
      publishOperationId: PUBLISH_JOB_ID,
      creativeStoragePaths: [
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_0.png`,
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
    const { supabase, uploadJobUpdatePayloads } = createSupabaseMock();
    const out = await runWizardPublish({
      supabase,
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map(),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      existingPublishJobId: PUBLISH_JOB_ID,
      fetchImpl,
    });

    expect(out.results[0].ok).toBe(false);
    expect(out.results[0].error).toMatch(/Ficheiro/);
    expect(fetchImpl).not.toHaveBeenCalled();

    const lastJobUpdate = uploadJobUpdatePayloads[uploadJobUpdatePayloads.length - 1];
    expect(lastJobUpdate?.status).toBe("error");
    expect(lastJobUpdate?.error_details).toMatchObject({
      message: "Nenhuma publicação concluiu com sucesso no Meta.",
      items: [
        {
          accountName: "Conta A",
          creativeName: "a.png",
          error: expect.stringMatching(/Ficheiro/),
        },
      ],
    });
  });

  it("publishes a video creative via /advideos (chunked) + thumbnail + video_data", async () => {
    let videoPostCount = 0;
    const phasesSeen: string[] = [];
    let adCreativeBody: Record<string, unknown> | null = null;

    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("/advideos")) {
        videoPostCount++;
        const form = init?.body as FormData;
        const phase = String(form.get("upload_phase"));
        phasesSeen.push(phase);
        if (phase === "start") {
          return new Response(
            JSON.stringify({
              upload_session_id: "sess_v",
              video_id: "vid_777",
              start_offset: "0",
              end_offset: "3",
            }),
            { status: 200 }
          );
        }
        if (phase === "transfer") {
          return new Response(
            JSON.stringify({ start_offset: "3", end_offset: "3" }),
            { status: 200 }
          );
        }
        if (phase === "finish") {
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
      }
      if (url.includes("/vid_777/thumbnails")) {
        return new Response(
          JSON.stringify({
            data: [{ id: "t", uri: "https://thumb.example/p.jpg", is_preferred: true }],
          }),
          { status: 200 }
        );
      }
      if (url.includes("/vid_777") && (init?.method ?? "GET") === "GET") {
        return new Response(
          JSON.stringify({ id: "vid_777", status: { video_status: "ready" } }),
          { status: 200 }
        );
      }
      if (url.includes("/campaigns")) {
        return new Response(JSON.stringify({ id: "meta-camp-v" }), { status: 200 });
      }
      if (url.includes("/adcreatives")) {
        adCreativeBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        return new Response(JSON.stringify({ id: "meta-cr-v" }), { status: 200 });
      }
      if (url.includes("/adsets")) {
        return new Response(JSON.stringify({ id: "meta-as-v" }), { status: 200 });
      }
      if (url.includes("/ads") && !url.includes("adset")) {
        return new Response(JSON.stringify({ id: "meta-ad-v" }), { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });

    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "promo.mp4", type: "video" }],
      publishOperationId: PUBLISH_JOB_ID,
      creativeStoragePaths: [
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_0.mp4`,
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

    const { supabase, insertCampanhaRows } = createSupabaseMock();
    const out = await runWizardPublish({
      supabase,
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map([
        [0, { buffer: Buffer.from([1, 2, 3]), mimeType: "video/mp4" }],
      ]),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      existingPublishJobId: PUBLISH_JOB_ID,
      fetchImpl,
    });

    expect(out.results[0].ok).toBe(true);
    expect(out.results[0].metaCampaignId).toBe("meta-camp-v");
    expect(videoPostCount).toBeGreaterThanOrEqual(3);
    expect(phasesSeen).toContain("start");
    expect(phasesSeen).toContain("transfer");
    expect(phasesSeen).toContain("finish");
    expect(adCreativeBody).not.toBeNull();
    const oss = ((adCreativeBody ?? {}) as { object_story_spec?: Record<string, unknown> }).object_story_spec;
    const videoData = oss?.video_data as Record<string, unknown> | undefined;
    expect(videoData?.video_id).toBe("vid_777");
    expect(videoData?.image_url).toBe("https://thumb.example/p.jpg");
    const cta = videoData?.call_to_action as { type?: string; value?: { link?: string } } | undefined;
    expect(cta?.type).toBe("LEARN_MORE");
    expect(cta?.value?.link).toBe("https://example.com");

    const concluida = insertCampanhaRows.find((r) => r.status === "concluida");
    const videoCreatives = concluida?.creatives as Array<{ thumb?: string }> | undefined;
    expect(videoCreatives?.[0]?.thumb).toBe("https://thumb.example/p.jpg");
  });

  it("marks unit as error when video status returns error before creating campaign", async () => {
    let campaignCalled = false;
    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("/advideos")) {
        const form = init?.body as FormData;
        const phase = String(form.get("upload_phase"));
        if (phase === "start") {
          return new Response(
            JSON.stringify({
              upload_session_id: "sess_e",
              video_id: "vid_err",
              start_offset: "0",
              end_offset: "3",
            }),
            { status: 200 }
          );
        }
        if (phase === "transfer") {
          return new Response(
            JSON.stringify({ start_offset: "3", end_offset: "3" }),
            { status: 200 }
          );
        }
        if (phase === "finish") {
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
      }
      if (url.includes("/vid_err") && (init?.method ?? "GET") === "GET") {
        return new Response(
          JSON.stringify({
            id: "vid_err",
            status: {
              video_status: "error",
              processing_phase: { errors: [{ message: "codec inválido" }] },
            },
          }),
          { status: 200 }
        );
      }
      if (url.includes("/campaigns")) {
        campaignCalled = true;
        return new Response(JSON.stringify({ id: "should-not-create" }), { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });

    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "promo.mp4", type: "video" }],
      publishOperationId: PUBLISH_JOB_ID,
      creativeStoragePaths: [
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_0.mp4`,
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

    const { supabase, insertCampanhaRows } = createSupabaseMock();
    const out = await runWizardPublish({
      supabase,
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map([
        [0, { buffer: Buffer.from([1, 2, 3]), mimeType: "video/mp4" }],
      ]),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      existingPublishJobId: PUBLISH_JOB_ID,
      fetchImpl,
    });

    expect(out.results[0].ok).toBe(false);
    expect(out.results[0].error).toMatch(/codec inv\u00e1lido/);
    expect(campaignCalled).toBe(false);
  });

  it("deletes campaign when ad set creation fails after campaign exists", async () => {
    let deleteCalled = false;
    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
      const url = requestUrl(input);
      if (init?.method === "DELETE" && url.includes("meta-camp-orphan")) {
        deleteCalled = true;
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      if (url.includes("/adimages")) {
        return new Response(
          JSON.stringify({
            images: { f: { hash: "img_hash", url: "https://cdn.example/preview-fail.png" } },
          }),
          { status: 200 }
        );
      }
      if (url.includes("/campaigns")) {
        return new Response(JSON.stringify({ id: "meta-camp-orphan" }), { status: 200 });
      }
      if (url.includes("/adcreatives")) {
        return new Response(JSON.stringify({ id: "meta-cr-1" }), { status: 200 });
      }
      if (url.includes("/adsets")) {
        return new Response(
          JSON.stringify({ error: { message: "Ad set invalid", type: "OAuthException", code: 100 } }),
          { status: 400 }
        );
      }
      return new Response("unexpected", { status: 500 });
    });

    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "a.png", type: "image" }],
      publishOperationId: PUBLISH_JOB_ID,
      creativeStoragePaths: [
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_0.png`,
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

    const { supabase, insertCampanhaRows } = createSupabaseMock();
    const out = await runWizardPublish({
      supabase,
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map([[0, { buffer: Buffer.from([1, 2, 3]), mimeType: "image/png" }]]),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      existingPublishJobId: PUBLISH_JOB_ID,
      fetchImpl,
    });

    expect(out.results[0].ok).toBe(false);
    expect(out.results[0].error).toMatch(/Ad set invalid|OAuthException/i);
    expect(deleteCalled).toBe(true);

    const erroRow = insertCampanhaRows.find((r) => r.status === "erro");
    const failCreatives = erroRow?.creatives as Array<{ thumb?: string }> | undefined;
    expect(failCreatives?.[0]?.thumb).toBe("https://cdn.example/preview-fail.png");
  });
});
