import { createHash } from "node:crypto";

/** Stable fingerprint for cache keys — avoids storing raw tokens in Map/Redis keys. */
export function metaTokenCacheFingerprint(accessToken: string): string {
  return createHash("sha256").update(accessToken).digest("hex");
}
