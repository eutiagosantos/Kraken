import { META_GRAPH_ORIGIN } from "@/lib/meta/constants";
import { metaTokenCacheFingerprint } from "@/lib/meta/token-cache-key";

export type UserFacebookPage = {
  id: string;
  name: string;
  pictureUrl?: string;
  pageAccessToken?: string;
};

type MeAccountRow = {
  id?: string;
  name?: string;
  picture?: string | { data?: { url?: string } };
  access_token?: string;
};

/** Maps a single `me/accounts` node; exported for unit tests. */
export function mapMeAccountsNode(row: MeAccountRow): UserFacebookPage | null {
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (!id) return null;
  const name = typeof row.name === "string" && row.name.trim() ? row.name.trim() : id;
  let pictureUrl: string | undefined;
  const p = row.picture;
  if (typeof p === "string" && p.trim()) pictureUrl = p.trim();
  else if (p && typeof p === "object" && typeof p.data?.url === "string" && p.data.url.trim()) {
    pictureUrl = p.data.url.trim();
  }
  const pageAccessToken = typeof row.access_token === "string" && row.access_token.trim() ? row.access_token.trim() : undefined;
  return { id, name, ...(pictureUrl ? { pictureUrl } : {}), ...(pageAccessToken ? { pageAccessToken } : {}) };
}

export function pageIdInUserPages(pageId: string, pages: UserFacebookPage[]): boolean {
  const n = pageId.trim();
  if (!n) return false;
  return pages.some((p) => p.id === n);
}

const MAX_ME_ACCOUNTS_PAGES = 10;

const PAGE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min — pages rarely change
const pageCache = new Map<string, { pages: UserFacebookPage[]; expiresAt: number }>();

/**
 * Lists Facebook Pages the user can manage (`GET /me/accounts`).
 * Requires `pages_show_list` / `pages_manage_ads` on the user access token.
 * Results are cached in-process for 10 minutes to avoid a Meta API round-trip on every publish.
 */
export async function fetchUserFacebookPages(accessToken: string): Promise<UserFacebookPage[]> {
  const cacheKey = metaTokenCacheFingerprint(accessToken);
  const cached = pageCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.pages;
  const collected: UserFacebookPage[] = [];
  const first = new URL(`${META_GRAPH_ORIGIN}/me/accounts`);
  first.searchParams.set("fields", "id,name,picture{url},access_token");
  first.searchParams.set("limit", "100");
  first.searchParams.set("access_token", accessToken);
  let nextUrl: string | null = first.toString();

  for (let i = 0; i < MAX_ME_ACCOUNTS_PAGES && nextUrl; i++) {
    const res = await fetch(nextUrl, { next: { revalidate: 0 } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Graph me/accounts ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as { data?: MeAccountRow[]; paging?: { next?: string } };
    for (const row of json.data ?? []) {
      const mapped = mapMeAccountsNode(row);
      if (mapped) collected.push(mapped);
    }
    nextUrl = json.paging?.next ?? null;
  }

  pageCache.set(cacheKey, { pages: collected, expiresAt: Date.now() + PAGE_CACHE_TTL_MS });
  return collected;
}
