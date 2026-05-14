import { META_GRAPH_ORIGIN } from "@/lib/meta/constants";

export const MAX_PAGE_POSTS_LIMIT = 25;
export const DEFAULT_PAGE_POSTS_LIMIT = 10;

export function clampPagePostsLimit(raw: number | undefined | null): number {
  const n = typeof raw === "number" && Number.isFinite(raw) ? Math.floor(raw) : DEFAULT_PAGE_POSTS_LIMIT;
  return Math.min(MAX_PAGE_POSTS_LIMIT, Math.max(1, n));
}

export type PagePostEngagement = {
  id: string;
  message: string;
  createdTime: string;
  permalinkUrl: string | null;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  /** Filled when `read_insights` is on the Page token and Graph returns metrics; otherwise null. */
  impressions: number | null;
  engagedUsers: number | null;
};

type Summary = { total_count?: number };

function totalFromSummary(summary: unknown): number {
  if (!summary || typeof summary !== "object") return 0;
  const t = (summary as Summary).total_count;
  return typeof t === "number" && Number.isFinite(t) ? Math.max(0, Math.floor(t)) : 0;
}

function countFromEngagementEdge(edge: unknown): number {
  if (!edge || typeof edge !== "object") return 0;
  const summary = (edge as { summary?: unknown }).summary;
  return totalFromSummary(summary);
}

function countFromShares(shares: unknown): number {
  if (!shares || typeof shares !== "object") return 0;
  const c = (shares as { count?: number }).count;
  return typeof c === "number" && Number.isFinite(c) ? Math.max(0, Math.floor(c)) : 0;
}

/** Maps one node from `GET /{page-id}/posts`; exported for unit tests. */
export function mapGraphPagePostRow(row: Record<string, unknown> | null | undefined): PagePostEngagement | null {
  if (!row || typeof row !== "object") return null;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (!id) return null;
  const msg = typeof row.message === "string" ? row.message.trim() : "";
  const story = typeof row.story === "string" ? row.story.trim() : "";
  const message = msg || story || "";
  const createdTime = typeof row.created_time === "string" ? row.created_time.trim() : "";
  if (!createdTime) return null;
  let permalinkUrl: string | null = null;
  if (typeof row.permalink_url === "string" && row.permalink_url.trim()) {
    permalinkUrl = row.permalink_url.trim();
  }
  return {
    id,
    message,
    createdTime,
    permalinkUrl,
    reactionCount: countFromEngagementEdge(row.reactions),
    commentCount: countFromEngagementEdge(row.comments),
    shareCount: countFromShares(row.shares),
    impressions: null,
    engagedUsers: null,
  };
}

/**
 * Recent Page posts with reaction and comment totals (Graph summaries).
 * Pass a **Page access token** from `GET /me/accounts` (see `/api/wizard/page-posts`); engagement fields require
 * `pages_read_engagement` and `pages_read_user_content` (and app access level) on the underlying grant.
 */
export async function fetchPagePostsWithEngagement(
  accessToken: string,
  pageId: string,
  limit: number
): Promise<PagePostEngagement[]> {
  const safeLimit = clampPagePostsLimit(limit);
  const pid = pageId.trim();
  if (!pid) return [];

  const url = new URL(`${META_GRAPH_ORIGIN}/${encodeURIComponent(pid)}/posts`);
  url.searchParams.set(
    "fields",
    "id,message,story,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)"
  );
  url.searchParams.set("limit", String(safeLimit));
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const bodyText = await res.text();
  let json: { data?: unknown[]; error?: { message?: string } };
  try {
    json = JSON.parse(bodyText) as { data?: unknown[]; error?: { message?: string } };
  } catch {
    throw new Error(`Graph page posts ${res.status}: invalid JSON`);
  }

  if (!res.ok) {
    const msg = json.error?.message ?? bodyText.slice(0, 400);
    throw new Error(`Graph page posts ${res.status}: ${msg}`);
  }
  if (json.error?.message) {
    throw new Error(`Graph page posts: ${json.error.message}`);
  }

  const out: PagePostEngagement[] = [];
  for (const row of json.data ?? []) {
    if (!row || typeof row !== "object") continue;
    const mapped = mapGraphPagePostRow(row as Record<string, unknown>);
    if (mapped) out.push(mapped);
  }
  return out;
}
