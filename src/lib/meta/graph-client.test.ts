import { describe, expect, it } from "vitest";

import { GraphApiError, graphJsonPost } from "@/lib/meta/graph-client";

describe("graphJsonPost", () => {
  it("throws GraphApiError with Meta message on 400 JSON body", async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          error: {
            message: "Invalid OAuth access token.",
            code: 190,
            error_user_title: "Token inválido",
            fbtrace_id: "trace1",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );

    await expect(
      graphJsonPost({
        path: "act_123/campaigns",
        accessToken: "bad",
        body: { name: "x" },
        fetchImpl,
      })
    ).rejects.toSatisfy((e: unknown) => {
      expect(e).toBeInstanceOf(GraphApiError);
      expect((e as GraphApiError).graphCode).toBe(190);
      expect((e as GraphApiError).fbtraceId).toBe("trace1");
      return true;
    });
  });

  it("returns parsed JSON on success", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ id: "cmp_1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const data = await graphJsonPost<{ id: string }>({
      path: "act_1/campaigns",
      accessToken: "token",
      body: { name: "N" },
      fetchImpl,
    });
    expect(data.id).toBe("cmp_1");
  });
});
