import { describe, expect, it } from "vitest";

import { buildAuthCallbackUrl } from "@/libs/auth/build-auth-callback-url";

describe("buildAuthCallbackUrl", () => {
  it("builds callback URL with encoded next path", () => {
    expect(buildAuthCallbackUrl("https://kraken-sigma-three.vercel.app", "/home")).toBe(
      "https://kraken-sigma-three.vercel.app/api/auth/callback?next=%2Fhome"
    );
  });

  it("rejects unsafe next paths", () => {
    expect(buildAuthCallbackUrl("https://example.com", "//evil.com")).toBe(
      "https://example.com/api/auth/callback?next=%2Fhome"
    );
  });
});
