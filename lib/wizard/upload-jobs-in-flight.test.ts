import { describe, expect, it, vi } from "vitest";

import { checkInFlightUploadJob, partitionUploadJobsByActive } from "./upload-jobs-in-flight";

describe("partitionUploadJobsByActive", () => {
  it("splits in-flight vs history and sorts active by started_at desc", () => {
    const { activeJobs, historyJobs } = partitionUploadJobsByActive([
      {
        id: "a",
        status: "completed",
        started_at: "2026-01-10T10:00:00.000Z",
      },
      {
        id: "b",
        status: "processing",
        started_at: "2026-01-09T10:00:00.000Z",
      },
      {
        id: "c",
        status: "awaiting_creatives",
        started_at: "2026-01-11T10:00:00.000Z",
      },
    ]);
    expect(activeJobs.map((j) => j.id)).toEqual(["c", "b"]);
    expect(historyJobs.map((j) => j.id)).toEqual(["a"]);
  });
});

describe("checkInFlightUploadJob", () => {
  function mockChain(result: { data: { id: string } | null; error: { message: string } | null }) {
    const maybeSingle = vi.fn().mockResolvedValue(result);
    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ maybeSingle }),
            }),
          }),
        }),
      }),
    };
  }

  it("returns blockingId when a row exists", async () => {
    const supabase = mockChain({ data: { id: "job-1" }, error: null });
    const r = await checkInFlightUploadJob(supabase as never, "user-1");
    expect(r).toEqual({ ok: true, blockingId: "job-1" });
  });

  it("returns null blockingId when no row", async () => {
    const supabase = mockChain({ data: null, error: null });
    const r = await checkInFlightUploadJob(supabase as never, "user-1");
    expect(r).toEqual({ ok: true, blockingId: null });
  });

  it("returns ok false on query error (publish/init should 500)", async () => {
    const supabase = mockChain({ data: null, error: { message: "db down" } });
    const r = await checkInFlightUploadJob(supabase as never, "user-1");
    expect(r).toEqual({ ok: false, message: "db down" });
  });
});
