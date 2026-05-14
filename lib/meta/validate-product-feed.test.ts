import { describe, expect, it } from "vitest";

import { validateFeed } from "@/lib/meta/validate-product-feed";

describe("validateFeed", () => {
  it("passes minimal valid row", () => {
    const r = validateFeed([
      {
        retailer_id: "1",
        title: "T",
        description: "D",
        availability: "in stock",
        condition: "new",
        price: "9.99 EUR",
        image_link: "https://x/img.jpg",
        brand: "B",
        google_product_category: "Electronics",
      },
    ]);
    expect(r.ok).toBe(true);
    expect(r.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("flags duplicate retailer_id and auto-suffixes", () => {
    const base = {
      title: "T",
      description: "D",
      availability: "in stock",
      condition: "new",
      price: "1 EUR",
      image_link: "https://x/i.jpg",
      brand: "B",
      google_product_category: "X",
    };
    const r = validateFeed([
      { retailer_id: "a", ...base },
      { retailer_id: "a", ...base },
    ]);
    expect(r.normalizedRows[1]?.retailer_id).toMatch(/__dup/);
    expect(r.fixes.some((f) => f.field === "retailer_id")).toBe(true);
  });

  it("normalizes availability instock", () => {
    const r = validateFeed([
      {
        retailer_id: "z",
        title: "T",
        description: "D",
        availability: "instock",
        condition: "new",
        price: "2 EUR",
        image_link: "https://x/i.jpg",
        brand: "B",
        google_product_category: "X",
      },
    ]);
    expect(r.normalizedRows[0]?.availability).toBe("in stock");
  });
});
