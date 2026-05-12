import { describe, expect, it } from "vitest";

import { buildMultiMediaAdPostBodyJson, multiMediaImageEntry } from "@/lib/meta/multi-media-ad-payload";

describe("buildMultiMediaAdPostBodyJson", () => {
  it("includes media_sourcing_spec with multi_media entries", () => {
    const body = buildMultiMediaAdPostBodyJson({
      name: "Test",
      adsetId: "123",
      status: "PAUSED",
      creative: { object_story_spec: { page_id: "1", link_data: { link: "https://x.com" } } },
      mediaEntries: [multiMediaImageEntry("abc"), multiMediaImageEntry("def")],
    });
    expect(body.adset_id).toBe("123");
    expect(body.media_sourcing_spec).toEqual({
      images: [
        { hash: "abc", source: "multi_media", opt_in_status: "opt_in" },
        { hash: "def", source: "multi_media", opt_in_status: "opt_in" },
      ],
    });
    expect(typeof body.creative).toBe("string");
  });
});
