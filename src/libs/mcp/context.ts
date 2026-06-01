import "server-only";

import { db, type DbClient } from "@/libs/database";

export type McpContext = {
  userId: string;
  db: DbClient;
};

/** Scoped DB context for MCP tools (queries filter by user_id in app code). */
export function createMcpContext(userId: string): McpContext {
  return { userId, db };
}
