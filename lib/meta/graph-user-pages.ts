import { META_GRAPH_ORIGIN } from "@/lib/meta/constants";

export type UserFacebookPage = {
  id: string;
  name: string;
  pictureUrl?: string;
};

type MeAccountRow = {
  id?: string;
  name?: string;
  picture?: string | { data?: { url?: string } };
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
  return pictureUrl ? { id, name, pictureUrl } : { id, name };
}

export function pageIdInUserPages(pageId: string, pages: UserFacebookPage[]): boolean {
  const n = pageId.trim();
  if (!n) return false;
  return pages.some((p) => p.id === n);
}

const MAX_ME_ACCOUNTS_PAGES = 10;

/**
 * Lists Facebook Pages the user can manage (`GET /me/accounts`).
 * Requires `pages_show_list` / `pages_manage_ads` on the user access token.
 */
export async function fetchUserFacebookPages(accessToken: string): Promise<UserFacebookPage[]> {
  const collected: UserFacebookPage[] = [];
  const first = new URL(`${META_GRAPH_ORIGIN}/me/accounts`);
  first.searchParams.set("fields", "id,name,picture{url}");
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

  return collected;
}
