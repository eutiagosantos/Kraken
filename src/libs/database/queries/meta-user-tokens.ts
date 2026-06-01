import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/libs/database";
import { metaUserTokens } from "@/models/schema";

export type MetaUserTokenRow = {
  access_token: string;
  token_expires_at: string | null;
};

export async function getMetaUserToken(userId: string): Promise<MetaUserTokenRow | null> {
  const rows = await db
    .select({
      access_token: metaUserTokens.access_token,
      token_expires_at: metaUserTokens.token_expires_at,
    })
    .from(metaUserTokens)
    .where(eq(metaUserTokens.user_id, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertMetaUserToken(
  userId: string,
  accessToken: string,
  tokenExpiresAt: string | null
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .insert(metaUserTokens)
    .values({
      user_id: userId,
      access_token: accessToken,
      token_expires_at: tokenExpiresAt,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: metaUserTokens.user_id,
      set: {
        access_token: accessToken,
        token_expires_at: tokenExpiresAt,
        updated_at: now,
      },
    });
}
