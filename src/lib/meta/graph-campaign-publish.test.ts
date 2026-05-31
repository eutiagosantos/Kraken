import { describe, expect, it } from "vitest";

import { buildAdCreativeObjectStorySpec, normalizeActId } from "@/lib/meta/graph-campaign-publish";

describe("normalizeActId", () => {
  it("adds act_ prefix when missing", () => {
    expect(normalizeActId("12345")).toBe("act_12345");
  });

  it("keeps single act_ prefix", () => {
    expect(normalizeActId("act_999")).toBe("act_999");
  });
});

describe("buildAdCreativeObjectStorySpec", () => {
  it("adds call_to_action on image link_data", () => {
    const spec = buildAdCreativeObjectStorySpec({
      pageId: "p1",
      media: { kind: "image", imageHash: "h1" },
      linkUrl: "https://example.com",
      message: "Hello",
    }) as { link_data: Record<string, unknown> };
    expect(spec.link_data.call_to_action).toEqual({
      type: "LEARN_MORE",
      value: { link: "https://example.com" },
    });
  });
});
