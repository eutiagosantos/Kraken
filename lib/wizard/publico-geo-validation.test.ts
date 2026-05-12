import { describe, expect, it } from "vitest";

import { publicoHasCountryAndRegion } from "@/lib/wizard/publico-geo-validation";

describe("publicoHasCountryAndRegion", () => {
  it("is false with country only", () => {
    expect(
      publicoHasCountryAndRegion({
        locations: [{ type: "country", key: "BR", name: "Brazil" }],
      })
    ).toBe(false);
  });

  it("is true with country + state", () => {
    expect(
      publicoHasCountryAndRegion({
        locations: [
          { type: "country", key: "BR", name: "Brazil" },
          { type: "state", key: "123", name: "Minas Gerais" },
        ],
      })
    ).toBe(true);
  });

  it("is true with country + region", () => {
    expect(
      publicoHasCountryAndRegion({
        locations: [
          { type: "country", key: "BR", name: "Brazil" },
          { type: "region", key: "456", name: "Southeast" },
        ],
      })
    ).toBe(true);
  });

  it("is true with country + city (non-empty key)", () => {
    expect(
      publicoHasCountryAndRegion({
        locations: [
          { type: "country", key: "BR", name: "Brazil" },
          { type: "city", key: "789", name: "Belo Horizonte" },
        ],
      })
    ).toBe(true);
  });

  it("is false with country + city when city key is empty", () => {
    expect(
      publicoHasCountryAndRegion({
        locations: [
          { type: "country", key: "BR", name: "Brazil" },
          { type: "city", key: "", name: "Belo Horizonte" },
        ],
      })
    ).toBe(false);
  });
});
