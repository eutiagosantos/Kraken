import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { listActivityEventsByUserId } from "@/libs/database/queries/activity-events";
import { listCampanhaSummariesByUserId } from "@/libs/database/queries/campanhas";
import { listCreativeLibraryItemsByUserId } from "@/libs/database/queries/creative-library-items";
import { listHomeKpisByUserId } from "@/libs/database/queries/home-kpis";
import { listMetaAdAccountsSummaryForUser } from "@/libs/database/queries/meta-ad-accounts";
import {
  getUploadJobById,
  listUploadJobs,
} from "@/libs/database/queries/upload-jobs";
import { listWorkspacesWithRoleForUser } from "@/libs/database/queries/workspaces";
import { getMcpContext } from "@/libs/mcp/request-context";
import { mcpJsonText } from "@/libs/mcp/tool-result";

export function registerReadTools(server: McpServer): void {
  server.tool(
    "list_ad_accounts",
    "List Meta ad accounts linked to the authenticated Kraken user.",
    {},
    async () => {
      const { userId } = getMcpContext();
      try {
        const data = await listMetaAdAccountsSummaryForUser(userId);
        return mcpJsonText({ accounts: data });
      } catch (e) {
        return mcpJsonText({ error: e instanceof Error ? e.message : String(e) });
      }
    }
  );

  server.tool(
    "list_campaigns",
    "List campaigns (campanhas) stored in Kraken for this user.",
    { limit: z.number().int().min(1).max(100).optional() },
    async ({ limit }) => {
      const { userId } = getMcpContext();
      try {
        const data = await listCampanhaSummariesByUserId(userId, limit ?? 50);
        return mcpJsonText({ campaigns: data });
      } catch (e) {
        return mcpJsonText({ error: e instanceof Error ? e.message : String(e) });
      }
    }
  );

  server.tool(
    "get_dashboard",
    "Home dashboard KPIs, recent upload jobs, activity, and creative library for this user.",
    {},
    async () => {
      const { userId } = getMcpContext();
      try {
        const [kpis, uploads, activities, creatives] = await Promise.all([
          listHomeKpisByUserId(userId),
          listUploadJobs(userId, 12),
          listActivityEventsByUserId(userId, 25),
          listCreativeLibraryItemsByUserId(userId, 12),
        ]);
        return mcpJsonText({
          kpis,
          uploads,
          activities,
          creatives,
        });
      } catch (e) {
        return mcpJsonText({ error: e instanceof Error ? e.message : String(e) });
      }
    }
  );

  server.tool(
    "list_upload_jobs",
    "List upload/publish jobs (fila de processamento).",
    { limit: z.number().int().min(1).max(50).optional() },
    async ({ limit }) => {
      const { userId } = getMcpContext();
      try {
        const data = await listUploadJobs(userId, limit ?? 20);
        return mcpJsonText({ jobs: data });
      } catch (e) {
        return mcpJsonText({ error: e instanceof Error ? e.message : String(e) });
      }
    }
  );

  server.tool(
    "get_publish_status",
    "Poll publish job status by upload_jobs id (same as wizard publish polling).",
    { jobId: z.string().uuid() },
    async ({ jobId }) => {
      const { userId } = getMcpContext();
      try {
        const data = await getUploadJobById(userId, jobId);
        if (!data) return mcpJsonText({ error: "Job not found." });
        return mcpJsonText({ job: data });
      } catch (e) {
        return mcpJsonText({ error: e instanceof Error ? e.message : String(e) });
      }
    }
  );

  server.tool(
    "list_workspaces",
    "List workspaces the user belongs to.",
    {},
    async () => {
      const { userId } = getMcpContext();
      try {
        const workspaces = await listWorkspacesWithRoleForUser(userId);
        return mcpJsonText({ workspaces });
      } catch (e) {
        return mcpJsonText({ error: e instanceof Error ? e.message : String(e) });
      }
    }
  );

  server.tool(
    "list_notifications",
    "Recent activity events (notifications feed).",
    { limit: z.number().int().min(1).max(50).optional() },
    async ({ limit }) => {
      const { userId } = getMcpContext();
      try {
        const data = await listActivityEventsByUserId(userId, limit ?? 20);
        return mcpJsonText({ notifications: data });
      } catch (e) {
        return mcpJsonText({ error: e instanceof Error ? e.message : String(e) });
      }
    }
  );
}
