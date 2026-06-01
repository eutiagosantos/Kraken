import { describe, expect, it } from "vitest";

import {
  computeUnifiedPublishProgress,
  publishPhaseLabelPt,
  publishRatio,
  serverJobToPublishProgress,
  uploadRatio,
} from "@/libs/wizard/unified-publish-progress";

describe("uploadRatio / publishRatio", () => {
  it("clamps upload ratio to 0–1", () => {
    expect(uploadRatio(50, 100)).toBe(0.5);
    expect(uploadRatio(200, 100)).toBe(1);
    expect(uploadRatio(0, 0)).toBe(0);
  });

  it("clamps publish ratio to 0–1", () => {
    expect(publishRatio(3, 10)).toBe(0.3);
    expect(publishRatio(0, 0)).toBe(0);
  });
});

describe("computeUnifiedPublishProgress", () => {
  it('returns preparing at 5%, done at 100%, idle/error at 0%', () => {
    expect(
      computeUnifiedPublishProgress({
        phase: "preparing",
        uploadBytesUploaded: 0,
        uploadBytesTotal: 0,
        publishDone: 0,
        publishTotal: 0,
      })
    ).toBe(5);
    expect(
      computeUnifiedPublishProgress({
        phase: "done",
        uploadBytesUploaded: 0,
        uploadBytesTotal: 0,
        publishDone: 10,
        publishTotal: 10,
      })
    ).toBe(100);
    expect(
      computeUnifiedPublishProgress({
        phase: "idle",
        uploadBytesUploaded: 0,
        uploadBytesTotal: 0,
        publishDone: 0,
        publishTotal: 0,
      })
    ).toBe(0);
  });

  it("maps upload bytes into 5–40% band", () => {
    const half = computeUnifiedPublishProgress({
      phase: "uploading",
      uploadBytesUploaded: 500,
      uploadBytesTotal: 1000,
      publishDone: 0,
      publishTotal: 0,
    });
    expect(half).toBeGreaterThan(5);
    expect(half).toBeLessThan(40);

    const full = computeUnifiedPublishProgress({
      phase: "uploading",
      uploadBytesUploaded: 1000,
      uploadBytesTotal: 1000,
      publishDone: 0,
      publishTotal: 0,
    });
    expect(full).toBe(40);
  });

  it("maps publish done/total into 40–99% band", () => {
    const start = computeUnifiedPublishProgress({
      phase: "publishing",
      uploadBytesUploaded: 1000,
      uploadBytesTotal: 1000,
      publishDone: 0,
      publishTotal: 10,
    });
    expect(start).toBe(40);

    const mid = computeUnifiedPublishProgress({
      phase: "publishing",
      uploadBytesUploaded: 1000,
      uploadBytesTotal: 1000,
      publishDone: 5,
      publishTotal: 10,
    });
    expect(mid).toBeGreaterThan(40);
    expect(mid).toBeLessThan(99);

    const end = computeUnifiedPublishProgress({
      phase: "publishing",
      uploadBytesUploaded: 1000,
      uploadBytesTotal: 1000,
      publishDone: 10,
      publishTotal: 10,
    });
    expect(end).toBe(99);
  });

  it("publishing with total=0 stays at 40%", () => {
    expect(
      computeUnifiedPublishProgress({
        phase: "publishing",
        uploadBytesUploaded: 0,
        uploadBytesTotal: 0,
        publishDone: 0,
        publishTotal: 0,
      })
    ).toBe(40);
  });
});

describe("publishPhaseLabelPt", () => {
  it("includes file index during upload", () => {
    expect(
      publishPhaseLabelPt({
        phase: "uploading",
        uploadBytesUploaded: 1,
        uploadBytesTotal: 10,
        publishDone: 0,
        publishTotal: 0,
        uploadFileIndex: 2,
        uploadFileCount: 5,
      })
    ).toContain("(2/5)");
  });

  it("includes publish counters when total known", () => {
    expect(
      publishPhaseLabelPt({
        phase: "publishing",
        uploadBytesUploaded: 0,
        uploadBytesTotal: 0,
        publishDone: 4,
        publishTotal: 10,
      })
    ).toContain("4/10");
  });
});

describe("serverJobToPublishProgress", () => {
  it("maps processing job to publishing phase", () => {
    expect(serverJobToPublishProgress({ status: "processing", done: 2, total: 5 })).toEqual({
      phase: "publishing",
      publishDone: 2,
      publishTotal: 5,
    });
  });
});
