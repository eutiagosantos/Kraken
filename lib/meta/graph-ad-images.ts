import type { GraphFetch } from "@/lib/meta/graph-client";
import { graphFormPost } from "@/lib/meta/graph-client";

type AdImagesResponse = {
  images?: Record<string, { hash?: string; url?: string }>;
};

/**
 * Upload a binary image to the ad account. Requires `ads_management` on the token.
 * @see https://developers.facebook.com/docs/marketing-api/reference/ad-account/adimages
 */
export async function uploadAdImageToAccount(options: {
  actId: string;
  accessToken: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  fetchImpl?: GraphFetch;
}): Promise<{ hash: string; url?: string }> {
  const form = new FormData();
  const bytes = new Uint8Array(options.buffer);
  const blob = new Blob([bytes], { type: options.mimeType || "image/jpeg" });
  form.append("filename", blob, options.fileName.replace(/[^\w.\-]+/g, "_"));

  const json = await graphFormPost<AdImagesResponse>({
    path: `${options.actId}/adimages`,
    accessToken: options.accessToken,
    formData: form,
    fetchImpl: options.fetchImpl,
  });

  const images = json.images;
  if (!images || typeof images !== "object") {
    throw new Error("Resposta adimages sem campo images.");
  }
  const first = Object.values(images)[0];
  const hash = first?.hash;
  if (!hash) {
    throw new Error("Resposta adimages sem hash.");
  }
  const url = typeof first?.url === "string" && first.url.trim() ? first.url.trim() : undefined;
  return url ? { hash, url } : { hash };
}
