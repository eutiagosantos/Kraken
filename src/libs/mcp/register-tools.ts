import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerPublishTools } from "@/libs/mcp/tools/publish";
import { registerReadTools } from "@/libs/mcp/tools/read";
import { registerResearchTools } from "@/libs/mcp/tools/research";
import { registerSyncTools } from "@/libs/mcp/tools/sync";

export function registerKrakenMcpTools(server: McpServer): void {
  registerReadTools(server);
  registerResearchTools(server);
  registerSyncTools(server);
  registerPublishTools(server);
}
