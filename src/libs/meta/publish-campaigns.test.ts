import { describe, expect, it, vi, beforeEach } from "vitest";

import { wizardPublishPayloadSchema } from "@/libs/meta/map-wizard-to-graph";
import { runWizardPublish } from "@/libs/meta/publish-campaigns";

const PUBLISH_JOB_ID = "aaaaaaaa-bbbb-4ccc-a000-eeeeeeeeeeee";
const uploadJobUpdatePayloads: Record<string, unknown>[] = [];
const insertCampanhaRows: Record<string, unknown>[] = [];

vi.mock("@/libs/database/queries/upload-jobs", () => ({
  startUploadJobProcessing: vi.fn(async (_userId: string, _jobId: string, data: Record<string, unknown>) => {
    uploadJobUpdatePayloads.push({ ...data, status: "processing", done: 0 });
    return { id: PUBLISH_JOB_ID };
  }),
  updateUploadJobDone: vi.fn(async (_userId: string, _jobId: string, done: number) => {
    uploadJobUpdatePayloads.push({ done });
  }),
  updateUploadJobProgress: vi.fn(
    async (_userId: string, _jobId: string, done: number, summary: Record<string, unknown>, phase: string) => {
      uploadJobUpdatePayloads.push({
        done,
        summary: { ...summary, v: 1, publishPhase: phase, publishDone: done },
      });
    }
  ),
  finalizeUploadJob: vi.fn(async (_userId: string, _jobId: string, data: Record<string, unknown>) => {
    uploadJobUpdatePayloads.push(data);
  }),
}));

vi.mock("@/libs/database/queries/campanhas", () => ({
  insertCampanhaReturningId: vi.fn(async (row: Record<string, unknown>) => {
    insertCampanhaRows.push(row);
    if (row.status === "erro") return null;
    return { id: "camp-row-id" };
  }),
  insertCampanha: vi.fn(async (row: Record<string, unknown>) => {
    insertCampanhaRows.push(row);
  }),
}));

vi.mock("@/libs/database/queries/activity-events", () => ({
  insertActivityEvent: vi.fn(async () => undefined),
}));

beforeEach(() => {
  uploadJobUpdatePayloads.length = 0;
  insertCampanhaRows.length = 0;
});

const publicoFixture = {
  id: "p1",
  name: "Público",
  type: "custom" as const,
  locations: [{ type: "state" as const, key: "3847", name: "São Paulo" }],
  ageMin: 18,
  ageMax: 65,
  gender: "all" as const,
  interests: [] as { id: string; name: string }[],
  devices: ["mobile" as const],
  platforms: ["facebook" as const],
};

function requestUrl(input: Parameters<typeof fetch>[0]) {
  return typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
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

    const out = await runWizardPublish({
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

  it("sends ad set name from payload adSetNames and CTA link from adLinkUrl", async () => {
    const adsetBodies: Record<string, unknown>[] = [];
    let adCreativeBody: Record<string, unknown> | null = null;
    const adPostBodies: Record<string, unknown>[] = [];

    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
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
      if (url.includes("/adcreatives") && init?.method === "POST") {
        adCreativeBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        return new Response(JSON.stringify({ id: "meta-cr-1" }), { status: 200 });
      }
      if (url.includes("/adsets") && init?.method === "POST") {
        adsetBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify({ id: "meta-as-1" }), { status: 200 });
      }
      if (url.includes("/ads") && !url.includes("adset")) {
        if (init?.method === "POST") {
          adPostBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        }
        return new Response(JSON.stringify({ id: "meta-ad-1" }), { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });

    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "Nome criativo meta", type: "image" }],
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
      adSetNames: ["Meu conjunto"],
      destinationUrl: "https://payload-url.example/",
    });

    await runWizardPublish({
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map([[0, { buffer: Buffer.from([1, 2, 3]), mimeType: "image/png" }]]),
      pageId: "1234567890",
      adLinkUrl: "https://landing.example/special",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      existingPublishJobId: PUBLISH_JOB_ID,
      fetchImpl,
    });

    expect(adsetBodies).toHaveLength(1);
    expect(adsetBodies[0]?.name).toBe("Meu conjunto");
    expect(adCreativeBody).not.toBeNull();
    const oss = (adCreativeBody as { object_story_spec?: Record<string, unknown> }).object_story_spec;
    const linkData = oss?.link_data as Record<string, unknown> | undefined;
    const cta = linkData?.call_to_action as { type?: string; value?: { link?: string } } | undefined;
    expect(cta?.type).toBe("LEARN_MORE");
    expect(cta?.value?.link).toBe("https://landing.example/special");
    expect(linkData?.link).toBe("https://landing.example/special");

    expect(adPostBodies).toHaveLength(1);
    expect(adPostBodies[0]?.name).toBe("Nome criativo meta");
  });

  it("POST /ads: when adsPerAdset > 1, ad names use creative name plus set/ad suffix", async () => {
    const adPostBodies: Record<string, unknown>[] = [];

    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
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
      if (url.includes("/adcreatives") && init?.method === "POST") {
        return new Response(JSON.stringify({ id: "meta-cr-1" }), { status: 200 });
      }
      if (url.includes("/adsets") && init?.method === "POST") {
        return new Response(JSON.stringify({ id: "meta-as-1" }), { status: 200 });
      }
      if (url.includes("/ads") && !url.includes("adset") && init?.method === "POST") {
        adPostBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify({ id: `meta-ad-${adPostBodies.length}` }), { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });

    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [{ id: "c1", name: "BaseNome", type: "image" }],
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
      structure: "custom",
      customStructure: { campaigns: 1, adsets: 1, ads: 2 },
      nomenclaturePreview: "N",
      publico: publicoFixture,
    });

    const out = await runWizardPublish({
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

    expect(out.results[0]?.ok).toBe(true);
    expect(adPostBodies).toHaveLength(2);
    expect(adPostBodies[0]?.name).toBe("BaseNome · 1-1");
    expect(adPostBodies[1]?.name).toBe("BaseNome · 1-2");
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

    await runWizardPublish({
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

    await runWizardPublish({
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

    await runWizardPublish({
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
    const out = await runWizardPublish({
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
      creatives: [{ id: "c1", name: "promo.mp4", type: "video", primaryText: "Copy da plataforma" }],
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

    const out = await runWizardPublish({
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
    expect(videoData?.message).toBe("Copy da plataforma");
    const cta = videoData?.call_to_action as { type?: string; value?: { link?: string } } | undefined;
    expect(cta?.type).toBe("LEARN_MORE");
    expect(cta?.value?.link).toBe("https://example.com");

    const concluida = insertCampanhaRows.find((r) => r.status === "concluida");
    const videoCreatives = concluida?.creatives as Array<{ thumb?: string }> | undefined;
    expect(videoCreatives?.[0]?.thumb).toBe("https://thumb.example/p.jpg");
  });

  it("marks unit as error when video processing fails after campaign and ad sets are created", async () => {
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
        return new Response(JSON.stringify({ id: "meta-camp-vid-err" }), { status: 200 });
      }
      if (url.includes("/adsets")) {
        return new Response(JSON.stringify({ id: "meta-as-1" }), { status: 200 });
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

    const out = await runWizardPublish({
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
    expect(campaignCalled).toBe(true);
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

    const out = await runWizardPublish({
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
    expect(failCreatives?.[0]?.thumb).toBe("");
  });

  it("on PT billing unavailable for LINK_CLICKS billing, retries ad set with IMPRESSIONS then succeeds", async () => {
    let adsetPosts = 0;
    const adsetBodies: Record<string, unknown>[] = [];
    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
      const url = requestUrl(input);
      if (url.includes("/adimages")) {
        return new Response(
          JSON.stringify({
            images: { f: { hash: "img_hash", url: "https://cdn.example/preview.png" } },
          }),
          { status: 200 }
        );
      }
      if (url.includes("/campaigns") && init?.method === "POST") {
        return new Response(JSON.stringify({ id: "meta-camp-bill" }), { status: 200 });
      }
      if (url.includes("/adcreatives")) {
        return new Response(JSON.stringify({ id: "meta-cr-1" }), { status: 200 });
      }
      if (url.includes("/adsets") && init?.method === "POST") {
        adsetPosts++;
        adsetBodies.push(JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>);
        if (adsetPosts === 1) {
          return new Response(
            JSON.stringify({
              error: {
                message: "Invalid parameter",
                type: "OAuthException",
                code: 100,
                error_user_title: "Opção de cobrança indisponível",
                error_user_msg:
                  "As contas de anúncios de empresas novas nos Produtos do Facebook podem escolher esta opção após seguirem nossas políticas por várias semanas.",
              },
            }),
            { status: 400 }
          );
        }
        return new Response(JSON.stringify({ id: "meta-as-1" }), { status: 200 });
      }
      if (url.includes("/ads") && !url.includes("adset")) {
        return new Response(JSON.stringify({ id: "meta-ad-1" }), { status: 200 });
      }
      if (init?.method === "DELETE") {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
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

    const out = await runWizardPublish({
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

    expect(out.results[0].ok).toBe(true);
    expect(adsetBodies).toHaveLength(2);
    expect(adsetBodies[0].billing_event).toBe("LINK_CLICKS");
    expect(adsetBodies[1].billing_event).toBe("IMPRESSIONS");
    expect(adsetBodies[1].optimization_goal).toBe("LINK_CLICKS");
    expect(out.warnings.some((w) => w.includes("LINK_CLICKS") && w.includes("IMPRESSIONS"))).toBe(true);
  });

  it("rejects publish when multiple creatives without matching structure", async () => {
    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [
        { id: "c1", name: "a.png", type: "image" },
        { id: "c2", name: "b.png", type: "image" },
      ],
      publishOperationId: PUBLISH_JOB_ID,
      creativeStoragePaths: [
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_0.png`,
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_1.png`,
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

    await expect(
      runWizardPublish({
        userId: "00000000-0000-4000-8000-000000000001",
        accessToken: "token",
        payload,
        creativeFilesByIndex: new Map([
          [0, { buffer: Buffer.from([1]), mimeType: "image/png" }],
          [1, { buffer: Buffer.from([2]), mimeType: "image/png" }],
        ]),
        pageId: "1234567890",
        adLinkUrl: "https://example.com",
        accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
        existingPublishJobId: PUBLISH_JOB_ID,
        fetchImpl: graphFetchOk(),
      })
    ).rejects.toThrow(/vários criativos/i);
  });

  it("fused mode: one campaign, each ad set gets its own creative and ad", async () => {
    let campaignPosts = 0;
    let adsetPosts = 0;
    let adCreativePosts = 0;
    const adBodies: Array<{ name?: string; adset_id?: string; creative?: { creative_id?: string } }> = [];

    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
      const url = requestUrl(input);
      if (url.includes("/adimages")) {
        return new Response(
          JSON.stringify({
            images: { f: { hash: "img_hash", url: "https://cdn.example/preview.png" } },
          }),
          { status: 200 }
        );
      }
      if (url.includes("/campaigns") && init?.method === "POST") {
        campaignPosts++;
        return new Response(JSON.stringify({ id: "meta-camp-fused" }), { status: 200 });
      }
      if (url.includes("/adsets") && init?.method === "POST") {
        adsetPosts++;
        return new Response(JSON.stringify({ id: `as-${adsetPosts}` }), { status: 200 });
      }
      if (url.includes("/adcreatives") && init?.method === "POST") {
        adCreativePosts++;
        return new Response(JSON.stringify({ id: `cr-${adCreativePosts}` }), { status: 200 });
      }
      if (url.includes("/ads") && !url.includes("adset") && init?.method === "POST") {
        const b = JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>;
        adBodies.push({
          name: typeof b.name === "string" ? b.name : undefined,
          adset_id: String(b.adset_id ?? ""),
          creative: b.creative as { creative_id?: string },
        });
        return new Response(JSON.stringify({ id: `ad-${adBodies.length}` }), { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });

    const payload = wizardPublishPayloadSchema.parse({
      selectedAccountIds: ["111"],
      creatives: [
        { id: "c1", name: "a.png", type: "image" },
        { id: "c2", name: "b.png", type: "image" },
      ],
      publishOperationId: PUBLISH_JOB_ID,
      creativeStoragePaths: [
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_0.png`,
        `00000000-0000-4000-8000-000000000001/${PUBLISH_JOB_ID}/creative_1.png`,
      ],
      campaignType: "CBO",
      budget: 15,
      budgetPeriod: "daily",
      bidStrategy: "LOWEST_COST",
      objective: "OUTCOME_TRAFFIC",
      pixelId: "",
      status: "PAUSED",
      structure: "custom",
      customStructure: { campaigns: 1, adsets: 2, ads: 1 },
      nomenclaturePreview: "N",
      publico: publicoFixture,
    });

    const out = await runWizardPublish({
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "token",
      payload,
      creativeFilesByIndex: new Map([
        [0, { buffer: Buffer.from([1, 2, 3]), mimeType: "image/png" }],
        [1, { buffer: Buffer.from([4, 5, 6]), mimeType: "image/png" }],
      ]),
      pageId: "1234567890",
      adLinkUrl: "https://example.com",
      accounts: [{ meta_account_id: "act_111", name: "Conta A" }],
      existingPublishJobId: PUBLISH_JOB_ID,
      fetchImpl,
    });

    expect(campaignPosts).toBe(1);
    expect(adsetPosts).toBe(2);
    expect(adCreativePosts).toBe(2);
    expect(adBodies).toHaveLength(2);
    expect(adBodies.map((a) => a.name)).toEqual(["a.png", "b.png"]);
    expect(adBodies[0].adset_id).toBe("as-1");
    expect(adBodies[0].creative?.creative_id).toBe("cr-1");
    expect(adBodies[1].adset_id).toBe("as-2");
    expect(adBodies[1].creative?.creative_id).toBe("cr-2");

    expect(out.results).toHaveLength(1);
    expect(out.results[0].ok).toBe(true);
    expect(out.results[0].metaCampaignId).toBe("meta-camp-fused");
    expect(out.results[0].fusedCreativeNames).toEqual(["a.png", "b.png"]);

    const concluida = insertCampanhaRows.find((r) => r.status === "concluida");
    const metaIds = concluida?.meta_ids as {
      adCreativeId?: string;
      adCreativeIds?: string[];
      adSetIds?: string[];
    };
    expect(metaIds?.adCreativeIds).toEqual(["cr-1", "cr-2"]);
    expect(metaIds?.adCreativeId).toBe("cr-1");
    expect(metaIds?.adSetIds).toEqual(["as-1", "as-2"]);
    const crRows = concluida?.creatives as Array<{ name?: string }> | undefined;
    expect(crRows?.map((c) => c.name)).toEqual(["a.png", "b.png"]);
  });
});
