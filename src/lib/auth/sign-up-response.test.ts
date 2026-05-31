import { describe, expect, it } from "vitest";

import { isDuplicateSignUpResponse } from "@/lib/auth/sign-up-response";

describe("isDuplicateSignUpResponse", () => {
  it("returns true when identities is empty", () => {
    expect(isDuplicateSignUpResponse({ identities: [] })).toBe(true);
  });

  it("returns false when identities has an entry", () => {
    expect(isDuplicateSignUpResponse({ identities: [{ provider: "email" }] })).toBe(false);
  });

  it("returns false when user is null", () => {
    expect(isDuplicateSignUpResponse(null)).toBe(false);
  });

  it("returns false when identities is missing", () => {
    expect(isDuplicateSignUpResponse({})).toBe(false);
  });
});
