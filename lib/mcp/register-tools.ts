import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerPublishTools } from "@/lib/mcp/tools/publish";
import { registerReadTools } from "@/lib/mcp/tools/read";
import { registerResearchTools } from "@/lib/mcp/tools/research";
import { registerSyncTools } from "@/lib/mcp/tools/sync";

export function registerKrakenMcpTools(server: McpServer): void {
  registerReadTools(server);
  registerResearchTools(server);
  registerSyncTools(server);
  registerPublishTools(server);
}
