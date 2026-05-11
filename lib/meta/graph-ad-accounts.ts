export type GraphAdAccount = {
  id: string;
  name: string;
  account_status?: number;
};

type GraphListResponse<T> = {
  data?: T[];
  paging?: { next?: string };
};

export async function fetchGraphAdAccounts(accessToken: string): Promise<GraphAdAccount[]> {
  const collected: GraphAdAccount[] = [];
  let nextUrl: string | null = null;

  const first = new URL("https://graph.facebook.com/v21.0/me/adaccounts");
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

  return collected;
}

export function mapAccountStatus(status?: number): "ativa" | "suspensa" | "desconectada" {
  if (status === 1) return "ativa";
  if (status === 2 || status === 3) return "suspensa";
  return "desconectada";
}
