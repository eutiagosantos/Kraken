import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { decryptAppSecret, encryptAppSecret, getEncryptionKeyError } from "@/libs/meta/app-credentials-crypto";

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

  it("accepts 64-char hex key", () => {
    process.env.KRAKEN_ENCRYPTION_KEY = "ab".repeat(32);
    expect(getEncryptionKeyError()).toBeNull();
    expect(encryptAppSecret("x")).toContain(":");
  });

  it("accepts base64 key from openssl rand -base64 32", () => {
    process.env.KRAKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    expect(getEncryptionKeyError()).toBeNull();
    expect(encryptAppSecret("x")).toContain(":");
  });

  it("rejects invalid key length", () => {
    process.env.KRAKEN_ENCRYPTION_KEY = "too-short";
    expect(getEncryptionKeyError()).toContain("inválida");
  });
});
