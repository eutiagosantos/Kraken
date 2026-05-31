import { describe, expect, it } from "vitest";
import {
  formatCountUpValue,
  parseCountUpEnd,
} from "@/lib/motion/count-up-utils";

describe("parseCountUpEnd", () => {
  it("parses integers", () => {
    expect(parseCountUpEnd(10)).toEqual({
      kind: "numeric",
      end: 10,
      decimals: 0,
    });
  });

  it("treats composite strings as static values", () => {
    expect(parseCountUpEnd("24/7")).toEqual({
      kind: "static",
      value: "24/7",
    });
  });

  it("returns static values when no number is present", () => {
    expect(parseCountUpEnd("∞")).toEqual({
      kind: "static",
      value: "∞",
    });
  });
});

describe("formatCountUpValue", () => {
  it("rounds integers", () => {
    expect(formatCountUpValue(9.6, 0)).toBe("10");
  });

  it("keeps decimals when requested", () => {
    expect(formatCountUpValue(2.5, 1)).toBe("2.5");
  });
});
