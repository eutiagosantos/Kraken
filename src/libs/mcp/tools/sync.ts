import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { invalidateUserDataShortCache } from "@/libs/api/user-data-short-cache";
import { getMetaUserToken } from "@/libs/database/queries/meta-user-tokens";
import {
  listOwnedMetaAccountIds,
  updateFacebookPageForMetaAccounts,
  updateMetaAdAccountById,
  type MetaAdAccountUpdate,
} from "@/libs/database/queries/meta-ad-accounts";
import { fetchGraphAdAccounts } from "@/libs/meta/graph-ad-accounts";
import { normalizeActId } from "@/libs/meta/graph-campaign-publish";
import { inspectTokenScopes } from "@/libs/meta/graph-inspect-token";
import { getMetaGraphAccessToken } from "@/libs/meta/graph-token";
import {
  fetchUserFacebookPages,
  invalidatePageCache,
  pageIdInUserPages,
} from "@/libs/meta/graph-user-pages";
import { resolveMetaAppCredentials } from "@/libs/meta/resolve-app-credentials";
import { syncMetaAdAccountsForUser } from "@/libs/meta/sync-ad-accounts";
import { getMcpContext } from "@/libs/mcp/request-context";
import { mcpJsonText } from "@/libs/mcp/tool-result";

export function registerSyncTools(server: McpServer): void {
  server.tool(
    "sync_ad_accounts",
    "Sync Meta ad accounts from the stored user token into Kraken.",
    {},
    async () => {
      const { userId } = getMcpContext();
      const tokenRes = await getMetaGraphAccessToken(userId);
      if ("error" in tokenRes) return mcpJsonText({ error: tokenRes.error });

      const tokenRow = await getMetaUserToken(userId);

      const result = await syncMetaAdAccountsForUser(
        userId,
        tokenRes.accessToken,
        tokenRow?.token_expires_at ?? null
      );
      if (result.error) return mcpJsonText({ error: result.error, synced: result.synced });
      invalidatePageCache(tokenRes.accessToken);
      invalidateUserDataShortCache(userId);
      return mcpJsonText({ ok: true, synced: result.synced });
    }
  );

  server.tool(
    "inspect_token",
    "Inspect Meta token scopes and list accessible ad accounts (pass a user access token).",
    { token: z.string().min(10) },
    async ({ token }) => {
      const { userId } = getMcpContext();
      const metaAppCredentials = await resolveMetaAppCredentials(userId);
      try {
        const [accounts, scopeResult] = await Promise.all([
          fetchGraphAdAccounts(token),
          inspectTokenScopes(token, { credentials: metaAppCredentials }),
        ]);
        return mcpJsonText({
          ok: scopeResult.valid,
          missingScopes: scopeResult.valid ? scopeResult.missingScopes : [],
          error: scopeResult.valid ? undefined : scopeResult.error,
          accounts,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "inspect_failed";
        return mcpJsonText({ error: message });
      }
    }
  );

  server.tool(
    "link_facebook_page",
    "Set default Facebook Page on one or more ad accounts.",
    {
      pageId: z.string().min(1).max(64),
      metaAccountIds: z.array(z.string().min(1)).min(1).max(50),
    },
    async ({ pageId, metaAccountIds }) => {
      const { userId } = getMcpContext();
      const trimmedPageId = pageId.trim();
      const uniqueActs = Array.from(
        new Set(metaAccountIds.map((id) => normalizeActId(id)))
      ).filter(Boolean);
      if (uniqueActs.length === 0) {
        return mcpJsonText({ error: "Indica pelo menos uma conta de anúncios." });
      }

      const tokenRes = await getMetaGraphAccessToken(userId);
      if ("error" in tokenRes) return mcpJsonText({ error: tokenRes.error });

      let userPages;
      try {
        userPages = await fetchUserFacebookPages(tokenRes.accessToken);
      } catch (e) {
        const message = e instanceof Error ? e.message : "pages_fetch_failed";
        return mcpJsonText({ error: message });
      }

      if (!pageIdInUserPages(trimmedPageId, userPages)) {
        return mcpJsonText({
          error:
            "pageId não corresponde a nenhuma Página Facebook acessível com este token.",
        });
      }

      const pageName =
        userPages.find((p) => p.id.trim() === trimmedPageId)?.name?.trim().slice(0, 512) ?? null;

      let owned: string[];
      try {
        owned = await listOwnedMetaAccountIds(userId, uniqueActs);
      } catch (e) {
        const message = e instanceof Error ? e.message : "query_failed";
        return mcpJsonText({ error: message });
      }

      const ownedSet = new Set(owned);
      for (const act of uniqueActs) {
        if (!ownedSet.has(act)) {
          return mcpJsonText({ error: `Conta ${act} não pertence ao utilizador.` });
        }
      }

      const now = new Date().toISOString();
      try {
        await updateFacebookPageForMetaAccounts(userId, uniqueActs, {
          facebook_page_id: trimmedPageId,
          facebook_page_name: pageName,
          updated_at: now,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "query_failed";
        return mcpJsonText({ error: message });
      }
      invalidateUserDataShortCache(userId);
      invalidatePageCache(tokenRes.accessToken);
      return mcpJsonText({ ok: true, updated: uniqueActs.length });
    }
  );

  server.tool(
    "update_account_defaults",
    "Update Kraken defaults for an ad account (internal UUID id from list_ad_accounts).",
    {
      accountId: z.string().uuid(),
      nickname: z.string().max(120).nullable().optional(),
      defaultBudget: z.number().nullable().optional(),
      defaultStructure: z.string().max(32).nullable().optional(),
      defaultAntiSpy: z.boolean().nullable().optional(),
      facebookPageId: z.string().max(64).nullable().optional(),
      facebookPageName: z.string().max(512).nullable().optional(),
    },
    async (args) => {
      const { userId } = getMcpContext();
      const updates: MetaAdAccountUpdate = { updated_at: new Date().toISOString() };
      if (args.nickname !== undefined) updates.nickname = args.nickname;
      if (args.defaultBudget !== undefined) updates.default_budget = args.defaultBudget;
      if (args.defaultStructure !== undefined) updates.default_structure = args.defaultStructure;
      if (args.defaultAntiSpy !== undefined) updates.default_anti_spy = args.defaultAntiSpy;
      if (args.facebookPageId !== undefined) {
        const t = args.facebookPageId?.trim();
        updates.facebook_page_id = t && t.length > 0 ? t : null;
      }
      if (args.facebookPageName !== undefined) {
        const t = args.facebookPageName?.trim();
        updates.facebook_page_name = t && t.length > 0 ? t : null;
      }

      try {
        const data = await updateMetaAdAccountById(userId, args.accountId, updates);
        if (!data) return mcpJsonText({ error: "Conta não encontrada." });
        invalidateUserDataShortCache(userId);
        return mcpJsonText({
          account: {
            id: data.id,
            meta_account_id: data.meta_account_id,
            name: data.name,
            nickname: data.nickname,
            default_budget: data.default_budget,
          },
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "query_failed";
        return mcpJsonText({ error: message });
      }
    }
  );
}
