import { describe, expect, it } from "vitest";

import { clampPagePostsLimit, mapGraphPagePostRow } from "@/lib/meta/graph-page-posts";

describe("clampPagePostsLimit", () => {
  it("clamps to 1..25", () => {
    expect(clampPagePostsLimit(0)).toBe(1);
    expect(clampPagePostsLimit(100)).toBe(25);
    expect(clampPagePostsLimit(12)).toBe(12);
  });

  it("defaults invalid input to 10", () => {
    expect(clampPagePostsLimit(undefined)).toBe(10);
    expect(clampPagePostsLimit(NaN)).toBe(10);
  });
});

describe("mapGraphPagePostRow", () => {
  it("maps message and engagement summaries", () => {
    const row = {
      id: "p1_2",
      message: "Hello",
      created_time: "2024-01-15T12:00:00+0000",
      permalink_url: "https://www.facebook.com/permalink",
      reactions: { summary: { total_count: 7 } },
      comments: { summary: { total_count: 2 } },
    };
    expect(mapGraphPagePostRow(row)).toEqual({
      id: "p1_2",
      message: "Hello",
      createdTime: "2024-01-15T12:00:00+0000",
      permalinkUrl: "https://www.facebook.com/permalink",
      reactionCount: 7,
      commentCount: 2,
      shareCount: 0,
      impressions: null,
      engagedUsers: null,
    });
  });

  it("uses story when message missing", () => {
    const row = {
      id: "x",
      story: "João partilhou uma foto.",
      created_time: "2024-02-01T00:00:00+0000",
    };
    const m = mapGraphPagePostRow(row);
    expect(m?.message).toBe("João partilhou uma foto.");
    expect(m?.reactionCount).toBe(0);
    expect(m?.shareCount).toBe(0);
    expect(m?.impressions).toBeNull();
  });

  it("maps shares count", () => {
    const row = {
      id: "p1",
      message: "x",
      created_time: "2024-01-15T12:00:00+0000",
      shares: { count: 4 },
    };
    expect(mapGraphPagePostRow(row)?.shareCount).toBe(4);
  });

  it("returns null without id or created_time", () => {
    expect(mapGraphPagePostRow({ created_time: "2024-01-01T00:00:00+0000" })).toBeNull();
    expect(mapGraphPagePostRow({ id: "x" })).toBeNull();
    expect(mapGraphPagePostRow(null)).toBeNull();
  });
});
