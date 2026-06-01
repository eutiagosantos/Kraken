import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/libs/database";
import { mcpApiKeys } from "@/models/schema";

export type McpApiKeyListRow = Pick<
  typeof mcpApiKeys.$inferSelect,
  "id" | "name" | "key_prefix" | "last_used_at" | "created_at" | "revoked_at"
>;

export type McpApiKeyCreatedRow = Pick<
  typeof mcpApiKeys.$inferSelect,
  "id" | "name" | "key_prefix" | "created_at"
>;

export async function listActiveMcpApiKeysByUserId(userId: string): Promise<McpApiKeyListRow[]> {
  return db
    .select({
      id: mcpApiKeys.id,
      name: mcpApiKeys.name,
      key_prefix: mcpApiKeys.key_prefix,
      last_used_at: mcpApiKeys.last_used_at,
      created_at: mcpApiKeys.created_at,
      revoked_at: mcpApiKeys.revoked_at,
    })
    .from(mcpApiKeys)
    .where(and(eq(mcpApiKeys.user_id, userId), isNull(mcpApiKeys.revoked_at)))
    .orderBy(desc(mcpApiKeys.created_at));
}

export async function insertMcpApiKey(input: {
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
}): Promise<McpApiKeyCreatedRow> {
  const now = new Date().toISOString();
  const [row] = await db
    .insert(mcpApiKeys)
    .values({
      user_id: input.userId,
      name: input.name,
      key_prefix: input.keyPrefix,
      key_hash: input.keyHash,
      created_at: now,
    })
    .returning({
      id: mcpApiKeys.id,
      name: mcpApiKeys.name,
      key_prefix: mcpApiKeys.key_prefix,
      created_at: mcpApiKeys.created_at,
    });
  if (!row) throw new Error("Insert mcp_api_keys sem linha devolvida.");
  return row;
}

export async function revokeMcpApiKeyForUser(
  userId: string,
  id: string,
  revokedAt: string
): Promise<{ id: string } | null> {
  const [row] = await db
    .update(mcpApiKeys)
    .set({ revoked_at: revokedAt })
    .where(and(eq(mcpApiKeys.id, id), eq(mcpApiKeys.user_id, userId), isNull(mcpApiKeys.revoked_at)))
    .returning({ id: mcpApiKeys.id });
  return row ?? null;
}

export async function findMcpApiKeyByHash(keyHash: string): Promise<{
  id: string;
  user_id: string;
  revoked_at: string | null;
} | null> {
  const [row] = await db
    .select({
      id: mcpApiKeys.id,
      user_id: mcpApiKeys.user_id,
      revoked_at: mcpApiKeys.revoked_at,
    })
    .from(mcpApiKeys)
    .where(eq(mcpApiKeys.key_hash, keyHash))
    .limit(1);
  return row ?? null;
}

export async function touchMcpApiKeyLastUsed(id: string, lastUsedAt: string): Promise<void> {
  void db.update(mcpApiKeys).set({ last_used_at: lastUsedAt }).where(eq(mcpApiKeys.id, id));
}
