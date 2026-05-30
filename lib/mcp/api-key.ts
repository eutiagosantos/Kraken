import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { createServiceSupabaseClient } from "@/lib/supabase/admin";

const KEY_PREFIX = "kr_mcp_";

export type GeneratedApiKey = {
  plaintext: string;
  prefix: string;
  hash: string;
};

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

/** Mint a new MCP API key. Plaintext is shown once to the user. */
export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(32).toString("base64url");
  const plaintext = `${KEY_PREFIX}${secret}`;
  const prefix = plaintext.slice(0, 16);
  const hash = hashApiKey(plaintext);
  return { plaintext, prefix, hash };
}

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.trim()) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  const token = match?.[1]?.trim();
  if (!token?.startsWith(KEY_PREFIX)) return null;
  return token;
}

export type ResolvedApiKeyUser = {
  userId: string;
};

/**
 * Resolve MCP caller from `Authorization: Bearer kr_mcp_…`.
 * Uses service-role client (bypasses RLS). Returns null if missing, invalid, or revoked.
 */
export async function resolveUserFromApiKey(
  authHeader: string | null
): Promise<ResolvedApiKeyUser | null> {
  const token = parseBearerToken(authHeader);
  if (!token) return null;

  const supabase = createServiceSupabaseClient();
  if (!supabase) return null;

  const keyHash = hashApiKey(token);
  const { data, error } = await supabase
    .from("mcp_api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error || !data || data.revoked_at) return null;

  const now = new Date().toISOString();
  void supabase.from("mcp_api_keys").update({ last_used_at: now }).eq("id", data.id);

  return { userId: data.user_id };
}
