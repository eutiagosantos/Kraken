import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchGraphAdAccounts, mapAccountStatus } from "@/lib/meta/graph-ad-accounts";
import type { Database } from "@/lib/supabase/types";

export async function syncMetaAdAccountsForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  accessToken: string,
  tokenExpiresAtIso: string | null
): Promise<{ synced: number; error?: string }> {
  try {
    const expiresAt = tokenExpiresAtIso ? new Date(tokenExpiresAtIso).toISOString() : null;

    const { error: tokenErr } = await supabase.from("meta_user_tokens").upsert(
      {
        user_id: userId,
        access_token: accessToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (tokenErr) {
      return { synced: 0, error: tokenErr.message };
    }

    const accounts = await fetchGraphAdAccounts(accessToken);

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("created_by", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const workspaceId = workspace?.id ?? null;

    let synced = 0;
    for (const acct of accounts) {
      const metaId = acct.id.replace(/^act_/i, "");
      const fullId = acct.id.startsWith("act_") ? acct.id : `act_${metaId}`;
      const status = mapAccountStatus(acct.account_status);

      const { error: upsertErr } = await supabase.from("meta_ad_accounts").upsert(
        {
          user_id: userId,
          workspace_id: workspaceId,
          meta_account_id: fullId,
          name: acct.name || fullId,
          status,
          token_status: "valido",
          token_expires_at: expiresAt,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,meta_account_id" }
      );

      if (!upsertErr) synced += 1;
    }

    return { synced };
  } catch (e) {
    const message = e instanceof Error ? e.message : "sync_failed";
    return { synced: 0, error: message };
  }
}
