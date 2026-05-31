import { describe, expect, it } from "vitest";

import { metaTokenCacheFingerprint } from "@/lib/meta/token-cache-key";

describe("metaTokenCacheFingerprint", () => {
  it("returns stable hex for same token", () => {
    const t = "short-token";
    expect(metaTokenCacheFingerprint(t)).toBe(metaTokenCacheFingerprint(t));
  });

  it("differs for different tokens", () => {
    expect(metaTokenCacheFingerprint("a")).not.toBe(metaTokenCacheFingerprint("b"));
  });
});
