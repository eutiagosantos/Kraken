import { afterEach, describe, expect, it, vi } from "vitest";

import {
  inspectTokenScopes,
  REQUIRED_PAGE_TOKEN_SCOPES_FOR_ENGAGEMENT_POSTS,
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
              scopes: ["pages_read_engagement", "pages_manage_ads", "pages_show_list"],
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
    if (r.valid) expect(r.missingScopes).toEqual(["ads_management", "ads_read"]);
  });
});
