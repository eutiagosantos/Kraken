import { META_GRAPH_ORIGIN } from "@/lib/meta/constants";

const LIFETIME_METRICS = ["post_impressions", "post_engaged_users"] as const;

function firstMetricValue(data: unknown, metricName: string): number | null {
  if (!Array.isArray(data)) return null;
  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const r = row as { name?: string; values?: unknown[] };
    if (r.name !== metricName) continue;
    const v0 = r.values?.[0];
    if (!v0 || typeof v0 !== "object") return null;
    const val = (v0 as { value?: unknown }).value;
    if (typeof val === "number" && Number.isFinite(val)) return Math.max(0, Math.floor(val));
    return null;
  }
  return null;
}

/**
 * Lifetime post-level metrics from `GET /{post-id}/insights` (requires `read_insights` on the Page token).
 */
export async function fetchPostLifetimeInsights(
  pageAccessToken: string,
  postId: string
): Promise<{ impressions: number | null; engagedUsers: number | null }> {
  const pid = postId.trim();
  if (!pid) return { impressions: null, engagedUsers: null };

  const url = new URL(`${META_GRAPH_ORIGIN}/${encodeURIComponent(pid)}/insights`);
  for (const m of LIFETIME_METRICS) {
    url.searchParams.append("metric", m);
  }
  url.searchParams.set("period", "lifetime");
  url.searchParams.set("access_token", pageAccessToken);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const bodyText = await res.text();
  let json: { data?: unknown; error?: { message?: string } };
  try {
    json = JSON.parse(bodyText) as typeof json;
  } catch {
    return { impressions: null, engagedUsers: null };
  }

  if (!res.ok || json.error?.message) {
    return { impressions: null, engagedUsers: null };
  }

  return {
    impressions: firstMetricValue(json.data, "post_impressions"),
    engagedUsers: firstMetricValue(json.data, "post_engaged_users"),
  };
}

const INSIGHT_CONCURRENCY = 5;

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]!);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return out;
}

/** Fetches lifetime impressions / engaged users per post when `read_insights` is present on the token. */
export async function enrichPostsWithLifetimeInsights<
  T extends { id: string; impressions?: number | null; engagedUsers?: number | null },
>(pageAccessToken: string, posts: T[]): Promise<T[]> {
  if (posts.length === 0) return posts;

  const snapshots = await mapPool(posts, INSIGHT_CONCURRENCY, async (post) =>
    fetchPostLifetimeInsights(pageAccessToken, post.id)
  );

  return posts.map((post, idx) => {
    const s = snapshots[idx]!;
    return {
      ...post,
      impressions: s.impressions,
      engagedUsers: s.engagedUsers,
    };
  });
}
