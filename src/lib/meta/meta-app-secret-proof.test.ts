import { describe, expect, it } from "vitest";

import { computeMetaAppSecretProof } from "@/lib/meta/meta-app-secret-proof";

describe("computeMetaAppSecretProof", () => {
  it("matches Meta HMAC-SHA256(access_token, app_secret) hex", () => {
    const proof = computeMetaAppSecretProof("user_token", "app_secret");
    expect(proof).toMatch(/^[a-f0-9]{64}$/);
    expect(proof).toBe(computeMetaAppSecretProof("user_token", "app_secret"));
  });
});
