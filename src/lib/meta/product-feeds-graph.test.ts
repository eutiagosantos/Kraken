import { describe, expect, it } from "vitest";

import { graphCreateProductFeed, graphCreateProductFeedUpload, graphListProductFeeds } from "@/lib/meta/product-feeds-graph";

describe("product-feeds-graph", () => {
  it("graphListProductFeeds", async () => {
    let url = "";
    const fetchImpl: typeof fetch = async (input) => {
      url = typeof input === "string" ? input : input.toString();
      return new Response(JSON.stringify({ data: [{ id: "f1", name: "Feed" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const rows = await graphListProductFeeds({ catalogId: "cat9", accessToken: "t", fetchImpl });
    expect(rows[0]?.id).toBe("f1");
    expect(url).toContain("/cat9/product_feeds");
  });

  it("graphCreateProductFeed includes url when set", async () => {
    let parsed: Record<string, unknown> = {};
    const fetchImpl: typeof fetch = async (_i, init) => {
      parsed = JSON.parse((init?.body as string) ?? "{}");
      return new Response(JSON.stringify({ id: "nf" }), { status: 200, headers: { "Content-Type": "application/json" } });
    };
    await graphCreateProductFeed({
      catalogId: "c",
      accessToken: "t",
      name: "URL feed",
      url: "https://example.com/feed.csv",
      fetchImpl,
    });
    expect(parsed).toMatchObject({ name: "URL feed", url: "https://example.com/feed.csv" });
  });

  it("graphCreateProductFeedUpload posts to uploads edge", async () => {
    let pathOk = false;
    const fetchImpl: typeof fetch = async (input) => {
      const u = typeof input === "string" ? input : input.toString();
      pathOk = u.includes("/feed99/uploads");
      return new Response(JSON.stringify({ id: "up1" }), { status: 200, headers: { "Content-Type": "application/json" } });
    };
    const r = await graphCreateProductFeedUpload({
      feedId: "feed99",
      accessToken: "t",
      url: "https://x/y.csv",
      fetchImpl,
    });
    expect(r.id).toBe("up1");
    expect(pathOk).toBe(true);
  });
});
