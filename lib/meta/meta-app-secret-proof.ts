import { createHmac } from "node:crypto";

/**
 * Meta `appsecret_proof` — HMAC-SHA256(access_token, app_secret) as hex.
 * @see https://developers.facebook.com/docs/graph-api/guides/secure-requests#appsecret_proof
 */
export function computeMetaAppSecretProof(accessToken: string, appSecret: string): string {
  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

/** Returns app secret from env when set (server-only). */
export function metaAppSecretFromEnv(): string | undefined {
  const s = process.env.META_APP_SECRET?.trim();
  return s || undefined;
}
