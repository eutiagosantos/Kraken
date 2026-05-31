import type { GraphFetch } from "@/lib/meta/graph-client";
import { graphJsonGet, graphJsonPost } from "@/lib/meta/graph-client";

export type ProductSetSummary = {
  id: string;
  name?: string;
  /** Dynamic set filter object when returned by Graph with fields=filter */
  filter?: string | Record<string, unknown>;
  product_catalog?: { id?: string };
};

type GraphCursorList<T> = {
  data?: T[];
  paging?: { cursors?: { after?: string } };
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

/** `GET /{catalog-id}/product_sets` */
export async function graphListProductSets(options: {
  catalogId: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
}): Promise<ProductSetSummary[]> {
  const cid = options.catalogId.trim();
  return graphGetAllPages<ProductSetSummary>(
    `${cid}/product_sets`,
    options.accessToken,
    { fields: "id,name,filter" },
    options.fetchImpl
  );
}

/**
 * `POST /{catalog-id}/product_sets`
 * Dynamic set: pass `filter` object per Meta Product Set filter DSL.
 * Static set: pass `product_ids` array of retailer / product ids (strings).
 */
export async function graphCreateProductSet(options: {
  catalogId: string;
  accessToken: string;
  name: string;
  filter?: Record<string, unknown>;
  productIds?: string[];
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  const cid = options.catalogId.trim();
  const body: Record<string, unknown> = { name: options.name.slice(0, 256) };
  if (options.filter && Object.keys(options.filter).length > 0) {
    body.filter = options.filter;
  }
  if (options.productIds && options.productIds.length > 0) {
    body.product_ids = options.productIds;
  }
  return graphJsonPost<{ id: string }>({
    path: `${cid}/product_sets`,
    accessToken: options.accessToken,
    body,
    fetchImpl: options.fetchImpl,
  });
}

/** `GET /{product-set-id}` */
export async function graphGetProductSet(options: {
  productSetId: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
}): Promise<ProductSetSummary> {
  const id = options.productSetId.trim();
  return graphJsonGet<ProductSetSummary>({
    path: id,
    accessToken: options.accessToken,
    searchParams: { fields: "id,name,filter,product_catalog" },
    fetchImpl: options.fetchImpl,
  });
}
