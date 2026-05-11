import { describe, expect, it } from "vitest";

import { uploadAdImageToAccount } from "@/lib/meta/graph-ad-images";

describe("uploadAdImageToAccount", () => {
  it("extracts hash from Graph adimages response", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ images: { "file.jpg": { hash: "abc123hash", url: "https://x" } } }), {
        status: 200,
      });

    const out = await uploadAdImageToAccount({
      actId: "act_999",
      accessToken: "tok",
      fileName: "file.jpg",
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
      mimeType: "image/jpeg",
      fetchImpl,
    });
    expect(out.hash).toBe("abc123hash");
  });
});
