import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/libs/database";
import { userMetaApps } from "@/models/schema";

export async function getUserMetaAppIdForUser(
  userId: string
): Promise<{ meta_app_id: string } | null> {
  const [row] = await db
    .select({ meta_app_id: userMetaApps.meta_app_id })
    .from(userMetaApps)
    .where(eq(userMetaApps.user_id, userId))
    .limit(1);
  return row ?? null;
}

export async function getUserMetaAppCredentialsForUser(userId: string): Promise<{
  meta_app_id: string;
  meta_app_secret_encrypted: string;
} | null> {
  const [row] = await db
    .select({
      meta_app_id: userMetaApps.meta_app_id,
      meta_app_secret_encrypted: userMetaApps.meta_app_secret_encrypted,
    })
    .from(userMetaApps)
    .where(eq(userMetaApps.user_id, userId))
    .limit(1);
  return row ?? null;
}

export async function upsertUserMetaApp(input: {
  userId: string;
  metaAppId: string;
  metaAppSecretEncrypted: string;
  now: string;
}): Promise<void> {
  await db
    .insert(userMetaApps)
    .values({
      user_id: input.userId,
      meta_app_id: input.metaAppId,
      meta_app_secret_encrypted: input.metaAppSecretEncrypted,
      created_at: input.now,
      updated_at: input.now,
    })
    .onConflictDoUpdate({
      target: userMetaApps.user_id,
      set: {
        meta_app_id: input.metaAppId,
        meta_app_secret_encrypted: input.metaAppSecretEncrypted,
        updated_at: input.now,
      },
    });
}

export async function deleteUserMetaAppForUser(userId: string): Promise<void> {
  await db.delete(userMetaApps).where(eq(userMetaApps.user_id, userId));
}
