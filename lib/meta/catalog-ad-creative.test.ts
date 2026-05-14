import { describe, expect, it } from "vitest";

import { buildCatalogDpaObjectStorySpec } from "@/lib/meta/catalog-ad-creative";

describe("buildCatalogDpaObjectStorySpec", () => {
  it("includes template_data and optional instagram_actor_id", () => {
    const spec = buildCatalogDpaObjectStorySpec({
      pageId: "p1",
      link: "https://shop.example",
      message: "Compre já",
      name: "Promo",
      instagramActorId: "ig123",
    }) as Record<string, unknown>;
    expect(spec.page_id).toBe("p1");
    expect(spec.instagram_actor_id).toBe("ig123");
    const td = spec.template_data as Record<string, unknown>;
    expect(td.link).toBe("https://shop.example");
    expect(td.message).toBe("Compre já");
  });
});
