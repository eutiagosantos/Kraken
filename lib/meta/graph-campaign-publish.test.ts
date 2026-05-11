import { describe, expect, it } from "vitest";

import { normalizeActId } from "@/lib/meta/graph-campaign-publish";

describe("normalizeActId", () => {
  it("adds act_ prefix when missing", () => {
    expect(normalizeActId("12345")).toBe("act_12345");
  });

  it("keeps single act_ prefix", () => {
    expect(normalizeActId("act_999")).toBe("act_999");
  });
});
