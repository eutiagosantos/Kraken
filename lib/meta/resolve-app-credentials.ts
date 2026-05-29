import type { SupabaseClient } from "@supabase/supabase-js";

import { decryptAppSecret } from "@/lib/meta/app-credentials-crypto";
import { metaAppSecretFromEnv } from "@/lib/meta/meta-app-secret-proof";
import type { Database } from "@/lib/supabase/types";

export type MetaAppCredentials = { appId: string; appSecret: string };

/** Loads per-user Meta app credentials from `user_meta_apps`, or null if not configured. */
export async function resolveMetaAppCredentials(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<MetaAppCredentials | null> {
  const { data, error } = await supabase
    .from("user_meta_apps")
    .select("meta_app_id, meta_app_secret_encrypted")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  try {
    const appSecret = decryptAppSecret(data.meta_app_secret_encrypted);
    const appId = data.meta_app_id.trim();
    if (!appId || !appSecret) return null;
    return { appId, appSecret };
  } catch {
    return null;
  }
}

/** App ID for debug_token: user config first, then env. */
export function resolveMetaAppId(credentials: MetaAppCredentials | null): string | undefined {
  const fromUser = credentials?.appId?.trim();
  if (fromUser) return fromUser;
  const fromEnv = process.env.META_APP_ID?.trim();
  return fromEnv || undefined;
}

/** App secret for appsecret_proof / debug_token: user config first, then env. */
export function resolveMetaAppSecret(credentials: MetaAppCredentials | null): string | undefined {
  const fromUser = credentials?.appSecret?.trim();
  if (fromUser) return fromUser;
  return metaAppSecretFromEnv();
}
