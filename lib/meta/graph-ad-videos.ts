import { graphUrl, type GraphFetch, GraphApiError, graphFormPost } from "@/lib/meta/graph-client";

/**
 * Upload de vídeos para o Meta Ads via Marketing API.
 *
 * Usamos chunked (resumable) upload — recomendado pela Meta para ficheiros >250 MB
 * e mais robusto que o single POST. Fases: start → transfer (loop) → finish.
 * @see https://developers.facebook.com/docs/marketing-api/guides/videoads
 */

type StartResponse = {
  upload_session_id: string;
  video_id: string;
  start_offset: string;
  end_offset: string;
};

type TransferResponse = {
  start_offset: string;
  end_offset: string;
};

type FinishResponse = {
  success: boolean;
};

function sanitizeFileName(name: string): string {
  const trimmed = name.trim() || "video.mp4";
  return trimmed.replace(/[^\w.\-]+/g, "_").slice(0, 200);
}

function parseOffsetNumber(value: string, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Resposta /advideos com offset inválido (${label}=${value}).`);
  }
  return n;
}

export async function uploadAdVideoChunked(options: {
  actId: string;
  accessToken: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  fetchImpl?: GraphFetch;
}): Promise<{ videoId: string }> {
  const fileSize = options.buffer.length;
  if (fileSize === 0) {
    throw new Error("Ficheiro de vídeo vazio.");
  }
  const safeName = sanitizeFileName(options.fileName);
  const chunkType = options.mimeType?.trim() || "video/mp4";

  const startForm = new FormData();
  startForm.append("upload_phase", "start");
  startForm.append("file_size", String(fileSize));
  const start = await graphFormPost<StartResponse>({
    path: `${options.actId}/advideos`,
    accessToken: options.accessToken,
    formData: startForm,
    fetchImpl: options.fetchImpl,
  });

  const sessionId = start.upload_session_id;
  const videoId = start.video_id;
  if (!sessionId || !videoId) {
    throw new Error("Resposta /advideos sem upload_session_id ou video_id.");
  }

  let startOffset = parseOffsetNumber(start.start_offset, "start_offset");
  let endOffset = parseOffsetNumber(start.end_offset, "end_offset");

  while (startOffset < endOffset) {
    const chunk = options.buffer.subarray(startOffset, endOffset);
    const bytes = new Uint8Array(chunk);
    const blob = new Blob([bytes], { type: chunkType });
    const form = new FormData();
    form.append("upload_phase", "transfer");
    form.append("upload_session_id", sessionId);
    form.append("start_offset", String(startOffset));
    form.append("video_file_chunk", blob, safeName);

    const transfer = await graphFormPost<TransferResponse>({
      path: `${options.actId}/advideos`,
      accessToken: options.accessToken,
      formData: form,
      fetchImpl: options.fetchImpl,
    });

    const nextStart = parseOffsetNumber(transfer.start_offset, "start_offset");
    const nextEnd = parseOffsetNumber(transfer.end_offset, "end_offset");
    if (nextStart <= startOffset && nextStart !== nextEnd) {
      throw new Error(
        `Upload do vídeo travado: start_offset não avançou (${startOffset} → ${nextStart}).`
      );
    }
    startOffset = nextStart;
    endOffset = nextEnd;
  }

  const finishForm = new FormData();
  finishForm.append("upload_phase", "finish");
  finishForm.append("upload_session_id", sessionId);
  finishForm.append("title", safeName);
  const finish = await graphFormPost<FinishResponse>({
    path: `${options.actId}/advideos`,
    accessToken: options.accessToken,
    formData: finishForm,
    fetchImpl: options.fetchImpl,
  });

  if (!finish.success) {
    throw new Error("Meta /advideos finish devolveu success=false.");
  }

  return { videoId };
}

type VideoStatusResponse = {
  id?: string;
  status?: {
    video_status?: "ready" | "processing" | "error" | string;
    processing_phase?: {
      status?: string;
      errors?: Array<{ message?: string }> | { message?: string };
    };
    uploading_phase?: {
      status?: string;
      errors?: Array<{ message?: string }> | { message?: string };
    };
  };
};

function extractStatusError(status: VideoStatusResponse["status"]): string {
  const phases = [status?.processing_phase, status?.uploading_phase];
  for (const phase of phases) {
    if (!phase) continue;
    const raw = phase.errors;
    if (Array.isArray(raw)) {
      const first = raw.find((e) => e?.message)?.message;
      if (first) return first;
    } else if (raw && typeof raw === "object" && raw.message) {
      return raw.message;
    }
  }
  return "Meta marcou o processamento do vídeo como erro.";
}

async function graphJsonGet<T>(options: {
  path: string;
  accessToken: string;
  searchParams?: Record<string, string>;
  fetchImpl?: GraphFetch;
}): Promise<T> {
  const fetchFn = options.fetchImpl ?? fetch;
  const url = new URL(graphUrl(options.path));
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  url.searchParams.set("access_token", options.accessToken);
  const res = await fetchFn(url.toString(), { method: "GET" });
  const raw = await res.text();
  if (!res.ok) {
    let message = `Graph GET HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string; code?: number } };
      if (parsed.error?.message) message = parsed.error.message;
    } catch {
      /* ignore */
    }
    throw new GraphApiError(message, { status: res.status, rawBody: raw });
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new GraphApiError("Resposta Graph inválida (não JSON).", {
      status: res.status,
      rawBody: raw.slice(0, 400),
    });
  }
}

export async function waitForAdVideoReady(options: {
  videoId: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
  timeoutMs?: number;
  intervalMs?: number;
  /** Injectável para testes; em produção, `setTimeout`. */
  sleep?: (ms: number) => Promise<void>;
}): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 300_000;
  const intervalMs = options.intervalMs ?? 3_000;
  const sleep =
    options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const deadline = Date.now() + timeoutMs;

  while (true) {
    const json = await graphJsonGet<VideoStatusResponse>({
      path: options.videoId,
      accessToken: options.accessToken,
      searchParams: { fields: "status" },
      fetchImpl: options.fetchImpl,
    });
    const vs = json.status?.video_status;
    if (vs === "ready") return;
    if (vs === "error") {
      throw new Error(extractStatusError(json.status));
    }
    if (Date.now() >= deadline) {
      throw new Error(
        `Timeout a aguardar processamento do vídeo (último estado: ${vs ?? "desconhecido"}).`
      );
    }
    await sleep(intervalMs);
  }
}

type ThumbnailNode = {
  id?: string;
  uri?: string;
  is_preferred?: boolean;
};

export async function fetchPreferredAdVideoThumbnail(options: {
  videoId: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
}): Promise<{ imageUrl: string }> {
  const json = await graphJsonGet<{ data?: ThumbnailNode[] }>({
    path: `${options.videoId}/thumbnails`,
    accessToken: options.accessToken,
    searchParams: { fields: "id,uri,is_preferred" },
    fetchImpl: options.fetchImpl,
  });
  const nodes = Array.isArray(json.data) ? json.data : [];
  const preferred = nodes.find((n) => n?.is_preferred && typeof n.uri === "string" && n.uri.trim());
  const chosen =
    preferred?.uri?.trim() ||
    nodes.find((n) => typeof n?.uri === "string" && n.uri.trim())?.uri?.trim() ||
    "";
  if (!chosen) {
    throw new Error("Meta não devolveu thumbnails para o vídeo carregado.");
  }
  return { imageUrl: chosen };
}
