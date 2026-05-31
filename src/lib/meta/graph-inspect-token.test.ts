import { afterEach, describe, expect, it, vi } from "vitest";

import {
  inspectTokenScopes,
  parseDebugTokenPayload,
  REQUIRED_PAGE_TOKEN_SCOPES_FOR_ENGAGEMENT_POSTS,
  validatePastedPageAccessToken,
} from "./graph-inspect-token";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.META_APP_ID;
  delete process.env.META_APP_SECRET;
});

describe("inspectTokenScopes", () => {
  it("uses requiredScopes when provided (page token shape)", async () => {
    process.env.META_APP_ID = "1";
    process.env.META_APP_SECRET = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: {
              is_valid: true,
              scopes: [
                "pages_read_engagement",
                "pages_manage_ads",
                "pages_show_list",
                "pages_read_user_content",
              ],
            },
          }),
      }))
    );

    const r = await inspectTokenScopes("page-token", {
      requiredScopes: REQUIRED_PAGE_TOKEN_SCOPES_FOR_ENGAGEMENT_POSTS,
    });
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.missingScopes).toEqual([]);
  });

  it("default required scopes still expect ads_* on user-style tokens", async () => {
    process.env.META_APP_ID = "1";
    process.env.META_APP_SECRET = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: {
              is_valid: true,
              scopes: ["pages_read_engagement", "pages_manage_ads", "pages_show_list"],
            },
          }),
      }))
    );

    const r = await inspectTokenScopes("token");
    expect(r.valid).toBe(true);
    if (r.valid)
      expect(r.missingScopes).toEqual([
        "ads_management",
        "ads_read",
        "pages_read_user_content",
        "pages_manage_posts",
      ]);
  });
});

describe("parseDebugTokenPayload", () => {
  it("maps profile_id as string and scopes", () => {
    const d = parseDebugTokenPayload({
      is_valid: true,
      type: "PAGE",
      profile_id: "123",
      scopes: ["pages_read_engagement"],
    });
    expect(d.isValid).toBe(true);
    expect(d.type).toBe("PAGE");
    expect(d.profileId).toBe("123");
    expect(d.scopes).toEqual(["pages_read_engagement"]);
  });

  it("coerces numeric profile_id", () => {
    const d = parseDebugTokenPayload({
      is_valid: true,
      type: "PAGE",
      profile_id: 999888777,
      scopes: [],
    });
    expect(d.profileId).toBe("999888777");
  });
});

describe("validatePastedPageAccessToken", () => {
  it("rejects when META_APP_ID is missing", async () => {
    const r = await validatePastedPageAccessToken("tok", "123");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("DEBUG_TOKEN_CONFIG");
  });

  it("accepts PAGE token when profile_id matches and base scopes present", async () => {
    process.env.META_APP_ID = "1";
    process.env.META_APP_SECRET = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: {
              is_valid: true,
              type: "PAGE",
              profile_id: "p1",
              scopes: [
                "pages_read_engagement",
                "pages_manage_ads",
                "pages_show_list",
                "pages_read_user_content",
              ],
            },
          }),
      }))
    );

    const r = await validatePastedPageAccessToken("paste", "p1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.missingBaseScopes).toEqual([]);
  });

  it("rejects USER token", async () => {
    process.env.META_APP_ID = "1";
    process.env.META_APP_SECRET = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: {
              is_valid: true,
              type: "USER",
              user_id: "u1",
              scopes: ["pages_read_engagement"],
            },
          }),
      }))
    );

    const r = await validatePastedPageAccessToken("paste", "p1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("NOT_PAGE_TOKEN");
  });

  it("rejects profile_id mismatch", async () => {
    process.env.META_APP_ID = "1";
    process.env.META_APP_SECRET = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: {
              is_valid: true,
              type: "PAGE",
              profile_id: "other",
              scopes: [
                "pages_read_engagement",
                "pages_manage_ads",
                "pages_show_list",
                "pages_read_user_content",
              ],
            },
          }),
      }))
    );

    const r = await validatePastedPageAccessToken("paste", "p1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("PAGE_TOKEN_PROFILE_MISMATCH");
  });
});
