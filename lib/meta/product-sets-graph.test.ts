import { describe, expect, it } from "vitest";

import { graphCreateProductSet, graphListProductSets } from "@/lib/meta/product-sets-graph";

describe("product-sets-graph", () => {
  it("graphListProductSets hits catalog edge", async () => {
    let url = "";
    const fetchImpl: typeof fetch = async (input) => {
      url = typeof input === "string" ? input : input.toString();
      return new Response(JSON.stringify({ data: [{ id: "ps1", name: "All" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const rows = await graphListProductSets({ catalogId: "cat1", accessToken: "t", fetchImpl });
    expect(rows[0]?.id).toBe("ps1");
    expect(url).toContain("/cat1/product_sets");
  });

  it("graphCreateProductSet sends filter for dynamic set", async () => {
    let parsed: Record<string, unknown> = {};
    const fetchImpl: typeof fetch = async (_input, init) => {
      parsed = JSON.parse((init?.body as string) ?? "{}");
      return new Response(JSON.stringify({ id: "newps" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    await graphCreateProductSet({
      catalogId: "c",
      accessToken: "t",
      name: "Brand A",
      filter: { is_any: [{ brand: { i_contains: "A" } }] },
      fetchImpl,
    });
    expect(parsed.name).toBe("Brand A");
    expect(parsed.filter).toEqual({ is_any: [{ brand: { i_contains: "A" } }] });
  });
});
