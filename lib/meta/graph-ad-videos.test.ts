import { describe, expect, it, vi } from "vitest";

import {
  fetchPreferredAdVideoThumbnail,
  uploadAdVideoChunked,
  waitForAdVideoReady,
} from "@/lib/meta/graph-ad-videos";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("uploadAdVideoChunked", () => {
  it("ciclo start → 2× transfer → finish com offsets dinâmicos", async () => {
    const buffer = Buffer.alloc(30, 0xab);
    const calls: Array<{ phase: string; chunkSize?: number; sessionId?: string; startOffset?: string }> = [];

    const fetchImpl: typeof fetch = vi.fn(async (_url, init) => {
      expect(init?.method).toBe("POST");
      const form = init?.body as FormData;
      const phase = String(form.get("upload_phase"));
      if (phase === "start") {
        expect(String(form.get("file_size"))).toBe("30");
        calls.push({ phase });
        return jsonResponse({
          upload_session_id: "sess_42",
          video_id: "vid_99",
          start_offset: "0",
          end_offset: "10",
        });
      }
      if (phase === "transfer") {
        const sessionId = String(form.get("upload_session_id"));
        const startOffset = String(form.get("start_offset"));
        const chunk = form.get("video_file_chunk") as Blob;
        calls.push({ phase, chunkSize: chunk.size, sessionId, startOffset });
        if (startOffset === "0") {
          return jsonResponse({ start_offset: "10", end_offset: "20" });
        }
        if (startOffset === "10") {
          return jsonResponse({ start_offset: "20", end_offset: "30" });
        }
        if (startOffset === "20") {
          return jsonResponse({ start_offset: "30", end_offset: "30" });
        }
        throw new Error(`unexpected start_offset ${startOffset}`);
      }
      if (phase === "finish") {
        expect(String(form.get("upload_session_id"))).toBe("sess_42");
        calls.push({ phase });
        return jsonResponse({ success: true });
      }
      throw new Error(`unexpected phase ${phase}`);
    });

    const out = await uploadAdVideoChunked({
      actId: "act_1",
      accessToken: "tok",
      fileName: "a video!.mp4",
      buffer,
      mimeType: "video/mp4",
      fetchImpl,
    });

    expect(out.videoId).toBe("vid_99");
    expect(calls.map((c) => c.phase)).toEqual([
      "start",
      "transfer",
      "transfer",
      "transfer",
      "finish",
    ]);
    expect(calls[1].chunkSize).toBe(10);
    expect(calls[2].chunkSize).toBe(10);
    expect(calls[3].chunkSize).toBe(10);
  });

  it("falha quando buffer está vazio (sem tocar na rede)", async () => {
    const fetchImpl = vi.fn();
    await expect(
      uploadAdVideoChunked({
        actId: "act_1",
        accessToken: "tok",
        fileName: "x.mp4",
        buffer: Buffer.alloc(0),
        mimeType: "video/mp4",
        fetchImpl,
      })
    ).rejects.toThrow(/vazio/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("falha quando offset não avança (proteção contra ciclo infinito)", async () => {
    const fetchImpl: typeof fetch = vi.fn(async (_url, init) => {
      const form = init?.body as FormData;
      const phase = String(form.get("upload_phase"));
      if (phase === "start") {
        return jsonResponse({
          upload_session_id: "s",
          video_id: "v",
          start_offset: "0",
          end_offset: "5",
        });
      }
      if (phase === "transfer") {
        return jsonResponse({ start_offset: "0", end_offset: "5" });
      }
      throw new Error("unexpected");
    });

    await expect(
      uploadAdVideoChunked({
        actId: "act_1",
        accessToken: "tok",
        fileName: "v.mp4",
        buffer: Buffer.alloc(10, 1),
        mimeType: "video/mp4",
        fetchImpl,
      })
    ).rejects.toThrow(/travado|n\u00e3o avan\u00e7ou/);
  });
});

describe("waitForAdVideoReady", () => {
  it("resolve quando o estado passa de processing → ready", async () => {
    const responses = [
      jsonResponse({ id: "v", status: { video_status: "processing" } }),
      jsonResponse({ id: "v", status: { video_status: "processing" } }),
      jsonResponse({ id: "v", status: { video_status: "ready" } }),
    ];
    const fetchImpl = vi.fn(async () => responses.shift()!);
    const sleep = vi.fn(async () => {});

    await waitForAdVideoReady({
      videoId: "v",
      accessToken: "tok",
      fetchImpl,
      timeoutMs: 60_000,
      intervalMs: 10,
      sleep,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("rejeita imediatamente em error com mensagem da Meta", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        id: "v",
        status: {
          video_status: "error",
          processing_phase: { status: "failed", errors: [{ message: "codec inválido" }] },
        },
      })
    );

    await expect(
      waitForAdVideoReady({
        videoId: "v",
        accessToken: "tok",
        fetchImpl,
        timeoutMs: 10_000,
        intervalMs: 10,
        sleep: async () => {},
      })
    ).rejects.toThrow(/codec inv\u00e1lido/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejeita ao exceder timeoutMs", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ id: "v", status: { video_status: "processing" } })
    );
    let now = 0;
    const realNow = Date.now;
    Date.now = () => now;
    try {
      const sleep = async (ms: number) => {
        now += ms;
      };
      await expect(
        waitForAdVideoReady({
          videoId: "v",
          accessToken: "tok",
          fetchImpl,
          timeoutMs: 50,
          intervalMs: 20,
          sleep,
        })
      ).rejects.toThrow(/Timeout/);
    } finally {
      Date.now = realNow;
    }
  });
});

describe("fetchPreferredAdVideoThumbnail", () => {
  it("escolhe is_preferred=true antes do primeiro", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        data: [
          { id: "t1", uri: "https://x/1.jpg", is_preferred: false },
          { id: "t2", uri: "https://x/2.jpg", is_preferred: true },
          { id: "t3", uri: "https://x/3.jpg", is_preferred: false },
        ],
      })
    );
    const out = await fetchPreferredAdVideoThumbnail({
      videoId: "v",
      accessToken: "tok",
      fetchImpl,
    });
    expect(out.imageUrl).toBe("https://x/2.jpg");
  });

  it("usa o primeiro quando nenhuma é preferida", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        data: [
          { id: "t1", uri: "https://x/a.jpg" },
          { id: "t2", uri: "https://x/b.jpg" },
        ],
      })
    );
    const out = await fetchPreferredAdVideoThumbnail({
      videoId: "v",
      accessToken: "tok",
      fetchImpl,
    });
    expect(out.imageUrl).toBe("https://x/a.jpg");
  });

  it("lança quando data está vazio", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: [] }));
    await expect(
      fetchPreferredAdVideoThumbnail({
        videoId: "v",
        accessToken: "tok",
        fetchImpl,
      })
    ).rejects.toThrow(/thumbnails/);
  });
});
