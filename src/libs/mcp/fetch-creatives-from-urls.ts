import "server-only";

const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;

function uploadMaxBytes(): number {
  const raw = process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES?.trim();
  if (!raw) return DEFAULT_MAX_BYTES;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_BYTES;
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

function mimeFromType(type: "image" | "video", headerType: string | null): string {
  const t = headerType?.split(";")[0]?.trim().toLowerCase();
  if (t && (IMAGE_TYPES.has(t) || VIDEO_TYPES.has(t))) return t;
  return type === "image" ? "image/jpeg" : "video/mp4";
}

export type FetchedCreative = {
  buffer: Buffer;
  mimeType: string;
};

/**
 * Download creatives from public URLs into the same Map shape as wizard storage download.
 */
export async function fetchCreativesFromUrls(
  creatives: Array<{ url: string; type: "image" | "video" }>
): Promise<Map<number, FetchedCreative>> {
  const maxBytes = uploadMaxBytes();
  const map = new Map<number, FetchedCreative>();

  for (let i = 0; i < creatives.length; i++) {
    const { url, type } = creatives[i]!;
    let response: Response;
    try {
      response = await fetch(url, { redirect: "follow", cache: "no-store" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "fetch_failed";
      throw new Error(`Não foi possível descarregar criativo ${i + 1} (${url}): ${msg}`);
    }

    if (!response.ok) {
      throw new Error(`Criativo ${i + 1}: HTTP ${response.status} ao descarregar ${url}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      const len = Number.parseInt(contentLength, 10);
      if (Number.isFinite(len) && len > maxBytes) {
        throw new Error(`Criativo ${i + 1} excede o limite de ${maxBytes} bytes.`);
      }
    }

    const arrayBuf = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (!buffer.length) {
      throw new Error(`Criativo ${i + 1} está vazio.`);
    }
    if (buffer.length > maxBytes) {
      throw new Error(`Criativo ${i + 1} excede o limite de ${maxBytes} bytes.`);
    }

    const mimeType = mimeFromType(type, response.headers.get("content-type"));
    map.set(i, { buffer, mimeType });
  }

  return map;
}
