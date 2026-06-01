import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { graphJsonGet } from "@/libs/meta/graph-client";
import { normalizeActId } from "@/libs/meta/graph-campaign-publish";
import { graphListOwnedProductCatalogs } from "@/libs/meta/catalog-graph";
import { getMetaGraphAccessToken } from "@/libs/meta/graph-token";
import {
  fetchUserFacebookPages,
  mapUserFacebookPagesToPublic,
} from "@/libs/meta/graph-user-pages";
import { listMetaAccountIdsForUser } from "@/libs/database/queries/meta-ad-accounts";
import { searchTargetingInterests, searchTargetingLocations } from "@/libs/meta/targeting";
import { getMcpContext } from "@/libs/mcp/request-context";
import { mcpJsonText } from "@/libs/mcp/tool-result";

type AdsPixelsPage = {
  data?: Array<{ id?: string; name?: string }>;
  paging?: { cursors?: { after?: string } };
};

async function listPixelsForAct(actId: string, accessToken: string) {
  const actPath = normalizeActId(actId);
  const out: Array<{ id: string; name: string }> = [];
  let after: string | undefined;
  for (let page = 0; page < 12; page++) {
    const searchParams: Record<string, string> = { fields: "id,name", limit: "100" };
    if (after) searchParams.after = after;
    const json = await graphJsonGet<AdsPixelsPage>({
      path: `${actPath}/adspixels`,
      accessToken,
      searchParams,
    });
    for (const row of json.data ?? []) {
      const id = row.id?.trim();
      if (!id) continue;
      out.push({ id, name: row.name?.trim() || `Pixel ${id}` });
    }
    after = json.paging?.cursors?.after;
    if (!after) break;
  }
  return out;
}

export function registerResearchTools(server: McpServer): void {
  server.tool(
    "search_interests",
    "Search Meta ad targeting interests by keyword.",
    { query: z.string().min(1).max(200) },
    async ({ query }) => {
      try {
        const interests = await searchTargetingInterests(query);
        return mcpJsonText({ interests });
      } catch (e) {
        const message = e instanceof Error ? e.message : "search_failed";
        return mcpJsonText({ error: message });
      }
    }
  );

  server.tool(
    "search_locations",
    "Search Meta geo targeting (countries, regions, cities).",
    { query: z.string().min(1).max(200) },
    async ({ query }) => {
      try {
        const locations = await searchTargetingLocations(query);
        return mcpJsonText({ locations });
      } catch (e) {
        const message = e instanceof Error ? e.message : "search_failed";
        return mcpJsonText({ error: message });
      }
    }
  );

  server.tool(
    "list_facebook_pages",
    "List Facebook Pages the user's Meta token can access.",
    {},
    async () => {
      const { userId } = getMcpContext();
      const tokenRes = await getMetaGraphAccessToken(userId);
      if ("error" in tokenRes) return mcpJsonText({ error: tokenRes.error });
      try {
        const pages = await fetchUserFacebookPages(tokenRes.accessToken);
        return mcpJsonText({ pages: mapUserFacebookPagesToPublic(pages) });
      } catch (e) {
        const message = e instanceof Error ? e.message : "pages_fetch_failed";
        return mcpJsonText({ error: message });
      }
    }
  );

  server.tool(
    "list_pixels",
    "List Meta pixels for ad account(s). Omit accountIds to use all linked accounts.",
    { accountIds: z.array(z.string()).optional() },
    async ({ accountIds }) => {
      const { userId } = getMcpContext();
      const tokenRes = await getMetaGraphAccessToken(userId);
      if ("error" in tokenRes) return mcpJsonText({ error: tokenRes.error });

      let acts = accountIds ?? [];
      if (acts.length === 0) {
        try {
          acts = await listMetaAccountIdsForUser(userId);
        } catch (e) {
          const message = e instanceof Error ? e.message : "query_failed";
          return mcpJsonText({ error: message });
        }
      }

      const seen = new Set<string>();
      const pixels: Array<{ id: string; name: string; accountId: string }> = [];
      for (const rawAct of acts) {
        const actPath = normalizeActId(rawAct);
        const accountId = actPath.replace(/^act_/i, "");
        try {
          const rows = await listPixelsForAct(actPath, tokenRes.accessToken);
          for (const row of rows) {
            if (seen.has(row.id)) continue;
            seen.add(row.id);
            pixels.push({ ...row, accountId });
          }
        } catch {
          /* skip inaccessible accounts */
        }
      }
      return mcpJsonText({ pixels });
    }
  );

  server.tool(
    "list_catalogs",
    "List product catalogs for a Meta Business ID.",
    { businessId: z.string().min(1) },
    async ({ businessId }) => {
      const { userId } = getMcpContext();
      const tokenRes = await getMetaGraphAccessToken(userId);
      if ("error" in tokenRes) return mcpJsonText({ error: tokenRes.error });
      try {
        const catalogs = await graphListOwnedProductCatalogs({
          businessId,
          accessToken: tokenRes.accessToken,
        });
        return mcpJsonText({ catalogs });
      } catch (e) {
        const message = e instanceof Error ? e.message : "catalog_fetch_failed";
        return mcpJsonText({ error: message });
      }
    }
  );
}
