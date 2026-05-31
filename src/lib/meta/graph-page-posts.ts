import { META_GRAPH_ORIGIN } from "@/lib/meta/constants";

export const MAX_PAGE_POSTS_LIMIT = 25;
export const DEFAULT_PAGE_POSTS_LIMIT = 10;

export function clampPagePostsLimit(raw: number | undefined | null): number {
  const n = typeof raw === "number" && Number.isFinite(raw) ? Math.floor(raw) : DEFAULT_PAGE_POSTS_LIMIT;
  return Math.min(MAX_PAGE_POSTS_LIMIT, Math.max(1, n));
}

/** Normalized from Graph `attachments[].media_type` (and fallbacks). */
export type PagePostMediaType = "photo" | "video" | "album" | "link" | "share" | "unknown";

export type PagePostEngagement = {
  id: string;
  message: string;
  createdTime: string;
  permalinkUrl: string | null;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  /** Image URL for UI (`full_picture` or first `attachments` / `subattachments` image). */
  previewImageUrl: string | null;
  mediaType: PagePostMediaType;
  /** First attachment has more than one subattachment (e.g. carousel). */
  isCarousel: boolean;
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

function normalizeGraphMediaType(raw: string | undefined): PagePostMediaType {
  const t = (raw ?? "").toLowerCase();
  if (t === "photo" || t === "sticker") return "photo";
  if (t === "video" || t === "video_inline" || t === "video_autoplay") return "video";
  if (t === "album" || t === "new_album") return "album";
  if (t === "link") return "link";
  if (t === "share") return "share";
  return "unknown";
}

function imageSrcFromMedia(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  const img = (media as { image?: unknown }).image;
  if (!img || typeof img !== "object") return null;
  const src = (img as { src?: string }).src;
  return typeof src === "string" && src.trim() ? src.trim() : null;
}

function firstImageFromAttachment(att: Record<string, unknown>): string | null {
  const fromMain = imageSrcFromMedia(att.media);
  if (fromMain) return fromMain;
  const subs = att.subattachments;
  if (!subs || typeof subs !== "object") return null;
  const data = (subs as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  for (const sub of data) {
    if (!sub || typeof sub !== "object") continue;
    const s = imageSrcFromMedia((sub as { media?: unknown }).media);
    if (s) return s;
  }
  return null;
}

function firstAttachmentRecord(row: Record<string, unknown>): {
  attachment: Record<string, unknown> | null;
  subattachmentCount: number;
} {
  const attachments = row.attachments;
  if (!attachments || typeof attachments !== "object") {
    return { attachment: null, subattachmentCount: 0 };
  }
  const data = (attachments as { data?: unknown }).data;
  if (!Array.isArray(data) || data.length === 0 || !data[0] || typeof data[0] !== "object") {
    return { attachment: null, subattachmentCount: 0 };
  }
  const attachment = data[0] as Record<string, unknown>;
  const subs = attachment.subattachments;
  let subattachmentCount = 0;
  if (subs && typeof subs === "object") {
    const sd = (subs as { data?: unknown }).data;
    if (Array.isArray(sd)) subattachmentCount = sd.length;
  }
  return { attachment, subattachmentCount };
}

/**
 * Picks preview URL and media kind from a Graph `/{page-id}/posts` row.
 * Prefer `full_picture`, then first image in `attachments` / `subattachments`.
 */
export function pickPostPreviewFromGraphRow(row: Record<string, unknown>): {
  previewImageUrl: string | null;
  mediaType: PagePostMediaType;
  isCarousel: boolean;
} {
  const fullPicture =
    typeof row.full_picture === "string" && row.full_picture.trim() ? row.full_picture.trim() : null;

  const { attachment, subattachmentCount } = firstAttachmentRecord(row);
  const isCarousel = subattachmentCount > 1;

  let mediaType: PagePostMediaType = "unknown";
  if (attachment) {
    const mt = typeof attachment.media_type === "string" ? attachment.media_type : "";
    mediaType = normalizeGraphMediaType(mt);
  }

  let previewImageUrl: string | null = fullPicture;
  if (!previewImageUrl && attachment) {
    previewImageUrl = firstImageFromAttachment(attachment);
  }

  return { previewImageUrl, mediaType, isCarousel };
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
  const { previewImageUrl, mediaType, isCarousel } = pickPostPreviewFromGraphRow(row);
  return {
    id,
    message,
    createdTime,
    permalinkUrl,
    reactionCount: countFromEngagementEdge(row.reactions),
    commentCount: countFromEngagementEdge(row.comments),
    shareCount: countFromShares(row.shares),
    previewImageUrl,
    mediaType,
    isCarousel,
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
    "id,message,story,created_time,permalink_url,full_picture,attachments{media_type,media{image{src},source},subattachments.limit(4){media_type,media{image{src}}}},shares,reactions.summary(true),comments.summary(true)"
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
