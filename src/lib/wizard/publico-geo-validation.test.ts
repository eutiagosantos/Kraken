import { describe, expect, it } from "vitest";

import {
  getPublicoGeoValidationErrorPt,
  publicoGeoHelpTextPt,
  publicoHasValidGeoLocations,
} from "@/lib/wizard/publico-geo-validation";

describe("getPublicoGeoValidationErrorPt", () => {
  it("accepts country-only (single ISO2)", () => {
    expect(
      getPublicoGeoValidationErrorPt({
        locations: [{ type: "country", key: "BR", name: "Brasil" }],
      })
    ).toBeNull();
  });

  it("accepts multiple countries only", () => {
    expect(
      getPublicoGeoValidationErrorPt({
        locations: [
          { type: "country", key: "BR", name: "Brasil" },
          { type: "country", key: "PT", name: "Portugal" },
        ],
      })
    ).toBeNull();
  });

  it("accepts sub-national only (multiple cities)", () => {
    expect(
      getPublicoGeoValidationErrorPt({
        locations: [
          { type: "city", key: "1", name: "Belo Horizonte" },
          { type: "city", key: "2", name: "São Paulo" },
        ],
      })
    ).toBeNull();
  });

  it("accepts sub-national state + city", () => {
    expect(
      getPublicoGeoValidationErrorPt({
        locations: [
          { type: "state", key: "3847", name: "Minas Gerais" },
          { type: "city", key: "789", name: "Belo Horizonte" },
        ],
      })
    ).toBeNull();
  });

  it("accepts region type with key", () => {
    expect(
      getPublicoGeoValidationErrorPt({
        locations: [{ type: "region", key: "456", name: "Sudeste" }],
      })
    ).toBeNull();
  });

  it("rejects mixed country + city", () => {
    const err = getPublicoGeoValidationErrorPt({
      locations: [
        { type: "country", key: "BR", name: "Brasil" },
        { type: "city", key: "789", name: "Belo Horizonte" },
      ],
    });
    expect(err).toContain("Não podes combinar");
  });

  it("rejects mixed country + state", () => {
    const err = getPublicoGeoValidationErrorPt({
      locations: [
        { type: "country", key: "BR", name: "Brasil" },
        { type: "state", key: "3847", name: "Minas Gerais" },
      ],
    });
    expect(err).toContain("Não podes combinar");
  });

  it("rejects empty locations", () => {
    expect(getPublicoGeoValidationErrorPt({ locations: [] })).toMatch(/Adiciona pelo menos/);
  });

  it("rejects country row with non-ISO key only (no sub-national)", () => {
    expect(
      getPublicoGeoValidationErrorPt({
        locations: [{ type: "country", key: "BRA", name: "Brasil" }],
      })
    ).toMatch(/Adiciona pelo menos/);
  });

  it("rejects sub-national with empty key only", () => {
    expect(
      getPublicoGeoValidationErrorPt({
        locations: [{ type: "city", key: "", name: "Belo Horizonte" }],
      })
    ).toMatch(/Adiciona pelo menos/);
  });

  it("allows city when another country row has empty key", () => {
    expect(
      getPublicoGeoValidationErrorPt({
        locations: [
          { type: "country", key: "", name: "Brasil" },
          { type: "city", key: "789", name: "Belo Horizonte" },
        ],
      })
    ).toBeNull();
  });
});

describe("publicoHasValidGeoLocations", () => {
  it("is true when validation error is null", () => {
    expect(publicoHasValidGeoLocations({ locations: [{ type: "country", key: "BR", name: "x" }] })).toBe(true);
    expect(publicoHasValidGeoLocations({ locations: [] })).toBe(false);
  });
});

describe("publicoGeoHelpTextPt", () => {
  it("describes mutually exclusive location modes", () => {
    const h = publicoGeoHelpTextPt();
    expect(h).toContain("só país");
    expect(h).toContain("não mistures");
  });
});
