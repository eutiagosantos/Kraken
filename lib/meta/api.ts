import { fetchGraphAdAccounts } from "@/lib/meta/graph-ad-accounts";
import type { MetaAccount } from "@/lib/meta/types";

export async function listMetaAccounts(accessToken: string): Promise<MetaAccount[]> {
  const rows = await fetchGraphAdAccounts(accessToken);
  return rows.map((a) => ({
    id: a.id,
    name: a.name || a.id,
  }));
}
