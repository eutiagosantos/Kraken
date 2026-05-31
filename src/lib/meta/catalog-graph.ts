import type { GraphFetch } from "@/lib/meta/graph-client";
import { graphJsonGet, graphJsonPost } from "@/lib/meta/graph-client";

export type ProductCatalogSummary = {
  id: string;
  name?: string;
  vertical?: string;
};

type GraphCursorList<T> = {
  data?: T[];
  paging?: { cursors?: { after?: string }; next?: string };
};

async function graphGetAllPages<T>(
  path: string,
  accessToken: string,
  baseParams: Record<string, string>,
  fetchImpl?: GraphFetch,
  maxPages = 10
): Promise<T[]> {
  const out: T[] = [];
  let after: string | undefined;
  for (let p = 0; p < maxPages; p++) {
    const params: Record<string, string> = { ...baseParams, limit: baseParams.limit ?? "100" };
    if (after) params.after = after;
    const json = await graphJsonGet<GraphCursorList<T>>({
      path,
      accessToken,
      searchParams: params,
      fetchImpl,
    });
    const chunk = json.data ?? [];
    out.push(...chunk);
    after = json.paging?.cursors?.after;
    if (!after || chunk.length === 0) break;
  }
  return out;
}

/** `GET /{business-id}/owned_product_catalogs` */
export async function graphListOwnedProductCatalogs(options: {
  businessId: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
}): Promise<ProductCatalogSummary[]> {
  const bid = options.businessId.replace(/^businesses\//i, "").trim();
  return graphGetAllPages<ProductCatalogSummary>(
    `${bid}/owned_product_catalogs`,
    options.accessToken,
    { fields: "id,name,vertical" },
    options.fetchImpl
  );
}

/** `POST /{business-id}/owned_product_catalogs` — creates a catalog on the Business. */
export async function graphCreateOwnedProductCatalog(options: {
  businessId: string;
  accessToken: string;
  name: string;
  /** e.g. `commerce` — optional; Meta defaults apply when omitted. */
  vertical?: string;
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  const bid = options.businessId.replace(/^businesses\//i, "").trim();
  const body: Record<string, unknown> = { name: options.name.slice(0, 256) };
  if (options.vertical?.trim()) body.vertical = options.vertical.trim();
  return graphJsonPost<{ id: string }>({
    path: `${bid}/owned_product_catalogs`,
    accessToken: options.accessToken,
    body,
    fetchImpl: options.fetchImpl,
  });
}

/** `GET /{catalog-id}` — fields `id,name,vertical`. */
export async function graphGetProductCatalog(options: {
  catalogId: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
}): Promise<ProductCatalogSummary> {
  const cid = options.catalogId.trim();
  return graphJsonGet<ProductCatalogSummary>({
    path: cid,
    accessToken: options.accessToken,
    searchParams: { fields: "id,name,vertical" },
    fetchImpl: options.fetchImpl,
  });
}
