import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { getMcpContext } from "@/lib/mcp/request-context";
import { mcpJsonText } from "@/lib/mcp/tool-result";

export function registerReadTools(server: McpServer): void {
  server.tool(
    "list_ad_accounts",
    "List Meta ad accounts linked to the authenticated Kraken user.",
    {},
    async () => {
      const { userId, supabase } = getMcpContext();
      const { data, error } = await supabase
        .from("meta_ad_accounts")
        .select(
          "id, meta_account_id, name, nickname, status, facebook_page_id, default_budget, connected_at"
        )
        .eq("user_id", userId)
        .order("connected_at", { ascending: false });
      if (error) return mcpJsonText({ error: error.message });
      return mcpJsonText({ accounts: data ?? [] });
    }
  );

  server.tool(
    "list_campaigns",
    "List campaigns (campanhas) stored in Kraken for this user.",
    { limit: z.number().int().min(1).max(100).optional() },
    async ({ limit }) => {
      const { userId, supabase } = getMcpContext();
      const { data, error } = await supabase
        .from("campanhas")
        .select(
          "id, name, account_name, account_meta_id, structure, objective, daily_budget, status, ads_created, ads_total, created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit ?? 50);
      if (error) return mcpJsonText({ error: error.message });
      return mcpJsonText({ campaigns: data ?? [] });
    }
  );

  server.tool(
    "get_dashboard",
    "Home dashboard KPIs, recent upload jobs, activity, and creative library for this user.",
    {},
    async () => {
      const { userId, supabase } = getMcpContext();
      const [kpisRes, uploadsRes, activitiesRes, creativesRes] = await Promise.all([
        supabase.from("home_kpis").select("*").eq("user_id", userId).order("label"),
        supabase
          .from("upload_jobs")
          .select("*")
          .eq("user_id", userId)
          .order("started_at", { ascending: false })
          .limit(12),
        supabase
          .from("activity_events")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("creative_library_items")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);
      const err =
        kpisRes.error?.message ||
        uploadsRes.error?.message ||
        activitiesRes.error?.message ||
        creativesRes.error?.message;
      if (err) return mcpJsonText({ error: err });
      return mcpJsonText({
        kpis: kpisRes.data ?? [],
        uploads: uploadsRes.data ?? [],
        activities: activitiesRes.data ?? [],
        creatives: creativesRes.data ?? [],
      });
    }
  );

  server.tool(
    "list_upload_jobs",
    "List upload/publish jobs (fila de processamento).",
    { limit: z.number().int().min(1).max(50).optional() },
    async ({ limit }) => {
      const { userId, supabase } = getMcpContext();
      const { data, error } = await supabase
        .from("upload_jobs")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(limit ?? 20);
      if (error) return mcpJsonText({ error: error.message });
      return mcpJsonText({ jobs: data ?? [] });
    }
  );

  server.tool(
    "get_publish_status",
    "Poll publish job status by upload_jobs id (same as wizard publish polling).",
    { jobId: z.string().uuid() },
    async ({ jobId }) => {
      const { userId, supabase } = getMcpContext();
      const { data, error } = await supabase
        .from("upload_jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return mcpJsonText({ error: error.message });
      if (!data) return mcpJsonText({ error: "Job not found." });
      return mcpJsonText({ job: data });
    }
  );

  server.tool(
    "list_workspaces",
    "List workspaces the user belongs to.",
    {},
    async () => {
      const { userId, supabase } = getMcpContext();
      const { data: memberships, error: memErr } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, created_at")
        .eq("user_id", userId);
      if (memErr) return mcpJsonText({ error: memErr.message });
      const ids = (memberships ?? []).map((m) => m.workspace_id);
      if (ids.length === 0) return mcpJsonText({ workspaces: [] });

      const { data: workspaces, error: wsErr } = await supabase
        .from("workspaces")
        .select("id, name, created_by, created_at")
        .in("id", ids);
      if (wsErr) return mcpJsonText({ error: wsErr.message });
      return mcpJsonText({
        workspaces: (workspaces ?? []).map((w) => ({
          ...w,
          role: memberships?.find((m) => m.workspace_id === w.id)?.role,
        })),
      });
    }
  );

  server.tool(
    "list_notifications",
    "Recent activity events (notifications feed).",
    { limit: z.number().int().min(1).max(50).optional() },
    async ({ limit }) => {
      const { userId, supabase } = getMcpContext();
      const { data, error } = await supabase
        .from("activity_events")
        .select("id, type, message, account, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit ?? 20);
      if (error) return mcpJsonText({ error: error.message });
      return mcpJsonText({ notifications: data ?? [] });
    }
  );
}
