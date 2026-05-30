import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

import type { McpContext } from "@/lib/mcp/context";

const storage = new AsyncLocalStorage<McpContext>();

export function runWithMcpContext<T>(ctx: McpContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getMcpContext(): McpContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error("MCP request context is not available.");
  }
  return ctx;
}
