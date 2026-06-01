import { describe, expect, it, vi } from "vitest";

import { findInFlightUploadJobId } from "@/libs/database/queries/upload-jobs";

import {
  partitionUploadJobsByActive,
  uploadJobShouldPollForUpdates,
} from "./upload-jobs-in-flight";
import { checkInFlightUploadJob } from "./upload-jobs-in-flight.server";

vi.mock("@/libs/database/queries/upload-jobs", () => ({
  findInFlightUploadJobId: vi.fn(),
  UPLOAD_JOB_IN_FLIGHT_STATUSES: ["awaiting_creatives", "processing"],
}));

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

describe("uploadJobShouldPollForUpdates", () => {
  const base = { id: "x", status: "processing" as const, started_at: "2026-01-15T12:00:00.000Z" };

  it("returns false for terminal statuses", () => {
    expect(uploadJobShouldPollForUpdates({ ...base, status: "completed" }, Date.UTC(2026, 0, 20))).toBe(false);
  });

  it("returns true for fresh in-flight job", () => {
    const now = Date.parse("2026-01-15T13:00:00.000Z");
    expect(uploadJobShouldPollForUpdates(base, now)).toBe(true);
  });

  it("returns false when job started longer ago than max poll age", () => {
    const now = Date.parse("2026-01-15T15:00:01.000Z");
    expect(uploadJobShouldPollForUpdates(base, now)).toBe(false);
  });
});

describe("checkInFlightUploadJob", () => {
  it("returns blockingId when a row exists", async () => {
    vi.mocked(findInFlightUploadJobId).mockResolvedValue("job-1");
    const r = await checkInFlightUploadJob("user-1");
    expect(r).toEqual({ ok: true, blockingId: "job-1" });
  });

  it("returns null blockingId when no row", async () => {
    vi.mocked(findInFlightUploadJobId).mockResolvedValue(null);
    const r = await checkInFlightUploadJob("user-1");
    expect(r).toEqual({ ok: true, blockingId: null });
  });

  it("returns ok false on query error (publish/init should 500)", async () => {
    vi.mocked(findInFlightUploadJobId).mockRejectedValue(new Error("db down"));
    const r = await checkInFlightUploadJob("user-1");
    expect(r).toEqual({ ok: false, message: "db down" });
  });
});
