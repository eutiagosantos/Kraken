import { upsertMetaAdAccountFromSync } from "@/libs/database/queries/meta-ad-accounts";
import { upsertMetaUserToken } from "@/libs/database/queries/meta-user-tokens";
import { getFirstWorkspaceByCreator } from "@/libs/database/queries/workspaces";
import { fetchGraphAdAccounts, mapAccountStatus } from "@/libs/meta/graph-ad-accounts";

export async function syncMetaAdAccountsForUser(
  userId: string,
  accessToken: string,
  tokenExpiresAtIso: string | null
): Promise<{ synced: number; error?: string }> {
  try {
    const expiresAt = tokenExpiresAtIso ? new Date(tokenExpiresAtIso).toISOString() : null;

    await upsertMetaUserToken(userId, accessToken, expiresAt);

    const accounts = await fetchGraphAdAccounts(accessToken);

    const workspace = await getFirstWorkspaceByCreator(userId);
    const workspaceId = workspace?.id ?? null;

    const now = new Date().toISOString();
    let synced = 0;
    for (const acct of accounts) {
      const metaId = acct.id.replace(/^act_/i, "");
      const fullId = acct.id.startsWith("act_") ? acct.id : `act_${metaId}`;
      const status = mapAccountStatus(acct.account_status);

      try {
        await upsertMetaAdAccountFromSync({
          user_id: userId,
          workspace_id: workspaceId,
          meta_account_id: fullId,
          name: acct.name || fullId,
          status,
          token_status: "valido",
          token_expires_at: expiresAt,
          last_activity_at: now,
          updated_at: now,
        });
        synced += 1;
      } catch {
        // skip individual account upsert failures
      }
    }

    return { synced };
  } catch (e) {
    const message = e instanceof Error ? e.message : "sync_failed";
    return { synced: 0, error: message };
  }
}
