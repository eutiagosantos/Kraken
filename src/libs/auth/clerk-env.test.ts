import { afterEach, describe, expect, it } from "vitest";

import { checkClerkEnv } from "./clerk-env";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("checkClerkEnv", () => {
  it("passes with live keys and redirect URLs in production mode", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_abc";
    process.env.CLERK_SECRET_KEY = "sk_live_xyz";
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL = "/login";
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL = "/cadastro";

    const result = checkClerkEnv({ production: true });
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.publishableKeyPrefix).toBe("pk_live_");
  });

  it("fails when test keys are used in production", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_abc";
    process.env.CLERK_SECRET_KEY = "sk_test_xyz";
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL = "/login";
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL = "/cadastro";

    const result = checkClerkEnv({ production: true });
    expect(result.ok).toBe(false);
    expect(result.issues).toContain("test_keys_in_production");
  });

  it("reports missing keys", () => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;

    const result = checkClerkEnv({ production: false });
    expect(result.ok).toBe(false);
    expect(result.issues).toContain("missing_publishable_key");
    expect(result.issues).toContain("missing_secret_key");
  });
});
