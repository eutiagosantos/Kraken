import { describe, expect, it } from "vitest";
import { formatBrlInputValue, parseBrlToNumber, sanitizeBrlTyping } from "./brl-money-input";

describe("sanitizeBrlTyping", () => {
  it("strips non-numeric junk", () => {
    expect(sanitizeBrlTyping("R$ 1a2b3")).toBe("123");
  });

  it("keeps one comma and caps fractional digits", () => {
    expect(sanitizeBrlTyping("12,345")).toBe("12,34");
  });

  it("drops extra commas after the first", () => {
    expect(sanitizeBrlTyping("1,2,3")).toBe("1,23");
  });

  it("collapses repeated dots on integer side", () => {
    expect(sanitizeBrlTyping("1..234")).toBe("1.234");
  });
});

describe("parseBrlToNumber", () => {
  it("returns undefined for empty", () => {
    expect(parseBrlToNumber("")).toBeUndefined();
    expect(parseBrlToNumber("   ")).toBeUndefined();
  });

  it("parses thousands with dot and decimal comma", () => {
    expect(parseBrlToNumber("1.234,56")).toBe(1234.56);
  });

  it("parses integer without comma", () => {
    expect(parseBrlToNumber("50")).toBe(50);
  });

  it("allows trailing comma as partial input", () => {
    expect(parseBrlToNumber("12,")).toBe(12);
  });

  it("parses zero", () => {
    expect(parseBrlToNumber("0")).toBe(0);
    expect(parseBrlToNumber("0,")).toBe(0);
  });

  it("returns undefined when only comma", () => {
    expect(parseBrlToNumber(",")).toBeUndefined();
  });
});

describe("formatBrlInputValue", () => {
  it("formats with pt-BR grouping and decimal comma", () => {
    expect(formatBrlInputValue(1234.56)).toBe("1.234,56");
  });

  it("formats 50 without forced decimals", () => {
    expect(formatBrlInputValue(50)).toBe("50");
  });
});
