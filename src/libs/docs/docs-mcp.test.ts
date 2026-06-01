import { describe, expect, it } from "vitest";

import {
  MCP_DOCS_SECTIONS,
  MCP_DOCS_TOOLS,
  MCP_ENDPOINT_SNIPPETS,
} from "@/libs/docs/mcp-tools-data";

const EXPECTED_TOOL_NAMES = [
  "list_ad_accounts",
  "list_campaigns",
  "get_dashboard",
  "list_upload_jobs",
  "get_publish_status",
  "list_workspaces",
  "list_notifications",
  "search_interests",
  "search_locations",
  "list_facebook_pages",
  "list_pixels",
  "list_catalogs",
  "sync_ad_accounts",
  "inspect_token",
  "link_facebook_page",
  "update_account_defaults",
  "prepare_campaign",
  "publish_campaign",
] as const;

describe("MCP docs data", () => {
  it("documents exactly 18 tools", () => {
    expect(MCP_DOCS_TOOLS).toHaveLength(18);
  });

  it("includes all expected tool names with category", () => {
    const names = MCP_DOCS_TOOLS.map((t) => t.name);
    for (const name of EXPECTED_TOOL_NAMES) {
      expect(names).toContain(name);
    }
    for (const tool of MCP_DOCS_TOOLS) {
      expect(tool.category).toBeTruthy();
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.responseExample.length).toBeGreaterThan(0);
    }
  });

  it("defines six documentation sections", () => {
    expect(MCP_DOCS_SECTIONS).toHaveLength(6);
    expect(MCP_DOCS_SECTIONS.map((s) => s.id)).toEqual([
      "intro",
      "instalacao",
      "autenticacao",
      "tools",
      "publish-flow",
      "seguranca",
    ]);
  });

  it("exposes endpoint snippets for installation", () => {
    expect(MCP_ENDPOINT_SNIPPETS.local).toContain("/api/mcp");
    expect(MCP_ENDPOINT_SNIPPETS.production).toBe(
      "https://kraken-sigma-three.vercel.app/api/mcp"
    );
    expect(MCP_ENDPOINT_SNIPPETS.claudeDesktop).toContain("mcpServers");
    expect(MCP_ENDPOINT_SNIPPETS.claudeDesktop).toContain("kraken-sigma-three.vercel.app");
    expect(MCP_ENDPOINT_SNIPPETS.authHeader).toContain("Bearer");
  });
});
