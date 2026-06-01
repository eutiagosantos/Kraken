import { afterEach, describe, expect, it, vi } from "vitest";

import { enrichPostsWithLifetimeInsights, fetchPostLifetimeInsights } from "./graph-post-insights";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPostLifetimeInsights", () => {
  it("parses metric rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: [
              { name: "post_impressions", values: [{ value: 100 }] },
              { name: "post_engaged_users", values: [{ value: 12 }] },
            ],
          }),
      }))
    );

    const r = await fetchPostLifetimeInsights("tok", "p_1");
    expect(r.impressions).toBe(100);
    expect(r.engagedUsers).toBe(12);
  });

  it("returns nulls on Graph error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        text: async () => JSON.stringify({ error: { message: "nope" } }),
      }))
    );

    const r = await fetchPostLifetimeInsights("tok", "p_1");
    expect(r.impressions).toBeNull();
    expect(r.engagedUsers).toBeNull();
  });
});

describe("enrichPostsWithLifetimeInsights", () => {
  it("merges snapshots in order", async () => {
    let n = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        n += 1;
        const imp = n === 1 ? 10 : 20;
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              data: [
                { name: "post_impressions", values: [{ value: imp }] },
                { name: "post_engaged_users", values: [{ value: 1 }] },
              ],
            }),
        };
      })
    );

    const posts = [
      { id: "a", impressions: null as number | null, engagedUsers: null as number | null },
      { id: "b", impressions: null, engagedUsers: null },
    ];
    const out = await enrichPostsWithLifetimeInsights("tok", posts);
    expect(out[0]!.impressions).toBe(10);
    expect(out[1]!.impressions).toBe(20);
  });
});
