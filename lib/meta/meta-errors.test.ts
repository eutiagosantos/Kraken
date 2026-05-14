import { describe, expect, it } from "vitest";

import { GraphApiError } from "@/lib/meta/graph-client";
import { parseMetaError, parseMetaErrorBody } from "@/lib/meta/meta-errors";

describe("parseMetaErrorBody", () => {
  it("reads fbtrace_id from error object", () => {
    const raw = JSON.stringify({
      error: {
        message: "oops",
        code: 100,
        fbtrace_id: "AbCdEf",
      },
    });
    expect(parseMetaErrorBody(raw).fbtraceId).toBe("AbCdEf");
  });
});

describe("parseMetaError", () => {
  it("classifies GraphApiError with 429 as retryable", () => {
    const e = new GraphApiError("limit", {
      status: 429,
      graphCode: 4,
      rawBody: "{}",
    });
    const c = parseMetaError(e);
    expect(c.retryable).toBe(true);
    expect(c.fatal).toBe(false);
  });

  it("prefers error_user_msg as friendly", () => {
    const e = new GraphApiError("technical", {
      status: 400,
      graphCode: 1815057,
      errorUserMsg: "Catálogo inválido.",
      rawBody: "{}",
    });
    expect(parseMetaError(e).friendlyMessage).toBe("Catálogo inválido.");
  });
});
