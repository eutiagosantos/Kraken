import type { GraphFetch } from "@/lib/meta/graph-client";
import { graphJsonGet } from "@/lib/meta/graph-client";
import { graphGetProductCatalog } from "@/lib/meta/catalog-graph";
import { graphGetProductSet } from "@/lib/meta/product-sets-graph";

export type CatalogCustomEventType = "PURCHASE" | "ADD_TO_CART" | "CONTENT_VIEW";

/** Ad set `promoted_object` for catalog + pixel conversion optimisation. */
export function buildCatalogPromotedObject(options: {
  productCatalogId: string;
  productSetId: string;
  pixelId: string;
  customEventType: CatalogCustomEventType;
}): Record<string, string> {
  return {
    product_catalog_id: options.productCatalogId.trim(),
    product_set_id: options.productSetId.trim(),
    pixel_id: options.pixelId.trim(),
    custom_event_type: options.customEventType,
  };
}

type GraphIdList = { data?: Array<{ id?: string }> };

/** Ensures the pixel id exists on the ad account (`GET act_…/adspixels`). */
export async function assertPixelOnAdAccount(options: {
  actId: string;
  accessToken: string;
  pixelId: string;
  fetchImpl?: GraphFetch;
}): Promise<void> {
  const act = options.actId.replace(/^act_/i, "").trim();
  const want = options.pixelId.replace(/\D/g, "");
  const json = await graphJsonGet<GraphIdList>({
    path: `act_${act}/adspixels`,
    accessToken: options.accessToken,
    searchParams: { fields: "id", limit: "200" },
    fetchImpl: options.fetchImpl,
  });
  const ids = new Set((json.data ?? []).map((p) => (p.id ?? "").replace(/\D/g, "")));
  if (!want || !ids.has(want)) {
    throw new Error("O pixel escolhido não pertence a esta conta de anúncios no Meta.");
  }
}

/** Verifies catalog exists and (best-effort) product set belongs to it via Graph reads. */
export async function assertCatalogAndProductSet(options: {
  catalogId: string;
  productSetId: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
}): Promise<void> {
  await graphGetProductCatalog({
    catalogId: options.catalogId.trim(),
    accessToken: options.accessToken,
    fetchImpl: options.fetchImpl,
  });
  const ps = await graphGetProductSet({
    productSetId: options.productSetId.trim(),
    accessToken: options.accessToken,
    fetchImpl: options.fetchImpl,
  });
  const pc = ps.product_catalog?.id?.replace(/\D/g, "");
  const want = options.catalogId.replace(/\D/g, "");
  if (pc && want && pc !== want) {
    throw new Error("O product set não pertence ao catálogo indicado.");
  }
}
