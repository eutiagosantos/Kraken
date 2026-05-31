import { describe, expect, it } from "vitest";

import { campanhaStructureDisplay, isCampanhaStructurePreset } from "@/lib/campanhas-structure";

describe("campanhaStructureDisplay", () => {
  it("strips custom: prefix for personalized structures", () => {
    expect(campanhaStructureDisplay("custom:1-3-1")).toBe("1-3-1");
    expect(campanhaStructureDisplay("custom:2-4-3")).toBe("2-4-3");
  });

  it("passes through known presets", () => {
    expect(campanhaStructureDisplay("1-250-1")).toBe("1-250-1");
    expect(campanhaStructureDisplay("1-50-1")).toBe("1-50-1");
    expect(campanhaStructureDisplay("1-3-5")).toBe("1-3-5");
    expect(campanhaStructureDisplay("1-1-5")).toBe("1-1-5");
  });

  it("does not fall back to 1-50-1 for unknown values", () => {
    expect(campanhaStructureDisplay("custom:9-9-9")).toBe("9-9-9");
    expect(campanhaStructureDisplay("weird-value")).toBe("weird-value");
  });
});

describe("isCampanhaStructurePreset", () => {
  it("recognizes API presets only", () => {
    expect(isCampanhaStructurePreset("1-3-5")).toBe(true);
    expect(isCampanhaStructurePreset("1-3-1")).toBe(false);
    expect(isCampanhaStructurePreset("custom:1-3-1")).toBe(false);
  });
});
