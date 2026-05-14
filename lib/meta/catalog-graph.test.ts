import { describe, expect, it } from "vitest";

import { graphCreateOwnedProductCatalog, graphListOwnedProductCatalogs } from "@/lib/meta/catalog-graph";

describe("catalog-graph", () => {
  it("graphListOwnedProductCatalogs requests owned_product_catalogs edge", async () => {
    let requestedUrl = "";
    const fetchImpl: typeof fetch = async (input) => {
      requestedUrl = typeof input === "string" ? input : input.toString();
      return new Response(
        JSON.stringify({
          data: [{ id: "123", name: "Cat", vertical: "commerce" }],
          paging: {},
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const rows = await graphListOwnedProductCatalogs({
      businessId: "555",
      accessToken: "tok",
      fetchImpl,
    });
    expect(rows).toEqual([{ id: "123", name: "Cat", vertical: "commerce" }]);
    expect(requestedUrl).toContain("/555/owned_product_catalogs");
    expect(requestedUrl).toContain("fields=id%2Cname%2Cvertical");
  });

  it("graphCreateOwnedProductCatalog posts name", async () => {
    let body = "";
    const fetchImpl: typeof fetch = async (input, init) => {
      body = (init?.body as string) ?? "";
      return new Response(JSON.stringify({ id: "999" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const r = await graphCreateOwnedProductCatalog({
      businessId: "777",
      accessToken: "tok",
      name: "My catalog",
      fetchImpl,
    });
    expect(r.id).toBe("999");
    expect(JSON.parse(body)).toEqual({ name: "My catalog" });
  });
});
