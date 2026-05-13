import { META_GRAPH_ORIGIN } from "@/lib/meta/constants";
import { metaTokenCacheFingerprint } from "@/lib/meta/token-cache-key";

export type GraphAdAccount = {
  id: string;
  name: string;
  account_status?: number;
};

type GraphListResponse<T> = {
  data?: T[];
  paging?: { next?: string };
};

const AD_ACCOUNTS_CACHE_TTL_MS = 5 * 60 * 1000;
const adAccountsCache = new Map<string, { accounts: GraphAdAccount[]; expiresAt: number }>();

export async function fetchGraphAdAccounts(accessToken: string): Promise<GraphAdAccount[]> {
  const cacheKey = metaTokenCacheFingerprint(accessToken);
  const hit = adAccountsCache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.accounts;

  const collected: GraphAdAccount[] = [];
  let nextUrl: string | null = null;

  const first = new URL(`${META_GRAPH_ORIGIN}/me/adaccounts`);
  first.searchParams.set("fields", "id,name,account_status");
  first.searchParams.set("limit", "100");
  first.searchParams.set("access_token", accessToken);
  nextUrl = first.toString();

  for (let page = 0; page < 5 && nextUrl; page++) {
    const res = await fetch(nextUrl, { next: { revalidate: 0 } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Graph adaccounts ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as GraphListResponse<GraphAdAccount>;
    if (json.data?.length) {
      collected.push(...json.data);
    }
    nextUrl = json.paging?.next ?? null;
  }

  adAccountsCache.set(cacheKey, { accounts: collected, expiresAt: Date.now() + AD_ACCOUNTS_CACHE_TTL_MS });
  return collected;
}

export function mapAccountStatus(status?: number): "ativa" | "suspensa" | "desconectada" {
  if (status === 1) return "ativa";
  if (status === 2 || status === 3) return "suspensa";
  return "desconectada";
}
