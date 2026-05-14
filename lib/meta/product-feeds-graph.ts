import type { GraphFetch } from "@/lib/meta/graph-client";
import { graphJsonGet, graphJsonPost } from "@/lib/meta/graph-client";

export type ProductFeedSummary = {
  id: string;
  name?: string;
  /** ISO schedule when requested via fields */
  schedule?: string;
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
    const params: Record<string, string> = { ...baseParams, limit: baseParams.limit ?? "50" };
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

/** `GET /{catalog-id}/product_feeds` */
export async function graphListProductFeeds(options: {
  catalogId: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
}): Promise<ProductFeedSummary[]> {
  const cid = options.catalogId.trim();
  return graphGetAllPages<ProductFeedSummary>(
    `${cid}/product_feeds`,
    options.accessToken,
    { fields: "id,name,schedule" },
    options.fetchImpl
  );
}

/**
 * `POST /{catalog-id}/product_feeds`
 * Common fields: `name`, `schedule` (hourly/daily etc. per Meta), and either `url` for remote feed or follow-up uploads.
 */
export async function graphCreateProductFeed(options: {
  catalogId: string;
  accessToken: string;
  name: string;
  /** Remote CSV/XML URL when using scheduled URL ingestion */
  url?: string;
  schedule?: string;
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  const cid = options.catalogId.trim();
  const body: Record<string, unknown> = { name: options.name.slice(0, 256) };
  if (options.url?.trim()) body.url = options.url.trim();
  if (options.schedule?.trim()) body.schedule = options.schedule.trim();
  return graphJsonPost<{ id: string }>({
    path: `${cid}/product_feeds`,
    accessToken: options.accessToken,
    body,
    fetchImpl: options.fetchImpl,
  });
}

/** `POST /{product-feed-id}/uploads` — triggers processing (CSV/XML upload session). */
export async function graphCreateProductFeedUpload(options: {
  feedId: string;
  accessToken: string;
  /** When uploading from URL */
  url?: string;
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  const fid = options.feedId.trim();
  const body: Record<string, unknown> = {};
  if (options.url?.trim()) body.url = options.url.trim();
  return graphJsonPost<{ id: string }>({
    path: `${fid}/uploads`,
    accessToken: options.accessToken,
    body,
    fetchImpl: options.fetchImpl,
  });
}

/** `GET /{upload-id}` — poll upload status (`end_time`, `error_count`, etc. when fields requested). */
export async function graphGetProductFeedUpload(options: {
  uploadId: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
}): Promise<Record<string, unknown>> {
  const uid = options.uploadId.trim();
  return graphJsonGet<Record<string, unknown>>({
    path: uid,
    accessToken: options.accessToken,
    searchParams: {
      fields: "id,upload_phase,start_time,end_time,error_count,warning_count",
    },
    fetchImpl: options.fetchImpl,
  });
}
