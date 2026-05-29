import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { decryptAppSecret, encryptAppSecret } from "@/lib/meta/app-credentials-crypto";

describe("app-credentials-crypto", () => {
  const prev = process.env.KRAKEN_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.KRAKEN_ENCRYPTION_KEY = "a".repeat(32);
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.KRAKEN_ENCRYPTION_KEY;
    else process.env.KRAKEN_ENCRYPTION_KEY = prev;
  });

  it("round-trips app secret", () => {
    const plain = "my-meta-app-secret-123";
    const stored = encryptAppSecret(plain);
    expect(stored).toContain(":");
    expect(decryptAppSecret(stored)).toBe(plain);
  });
});
