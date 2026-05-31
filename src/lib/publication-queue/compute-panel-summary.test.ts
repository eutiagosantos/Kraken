import { describe, expect, it } from "vitest";

import {
  computePublicationQueueSummary,
  formatDurationLabel,
  formatEtaLabel,
  formatPanelNumber,
} from "./compute-panel-summary";

describe("computePublicationQueueSummary", () => {
  const now = new Date("2026-05-29T14:00:00.000Z");

  it("aggregates queue, today ads, and active state", () => {
    const summary = computePublicationQueueSummary(
      [
        {
          total: 10,
          done: 3,
          status: "processing",
          started_at: "2026-05-29T10:00:00.000Z",
          finished_at: null,
        },
        {
          total: 5,
          done: 5,
          status: "completed",
          started_at: "2026-05-29T08:00:00.000Z",
          finished_at: "2026-05-29T08:01:00.000Z",
        },
      ],
      4,
      now
    );

    expect(summary.campaignsInQueue).toBe(7);
    expect(summary.adsPublishedToday).toBe(8);
    expect(summary.connectedAccounts).toBe(4);
    expect(summary.isActive).toBe(true);
    expect(summary.nextBatchProgress).toBe(30);
  });

  it("returns idle state when no in-flight jobs", () => {
    const summary = computePublicationQueueSummary(
      [
        {
          total: 2,
          done: 2,
          status: "completed",
          started_at: "2026-05-28T10:00:00.000Z",
          finished_at: "2026-05-28T10:00:30.000Z",
        },
      ],
      2,
      now
    );

    expect(summary.isActive).toBe(false);
    expect(summary.campaignsInQueue).toBe(0);
    expect(summary.adsPublishedToday).toBe(0);
  });
});

describe("format helpers", () => {
  it("formats ETA and duration labels", () => {
    expect(formatEtaLabel(58)).toBe("~58s");
    expect(formatDurationLabel(58)).toBe("58s");
    expect(formatDurationLabel(null)).toBe("—");
  });

  it("formats numbers in pt-BR", () => {
    expect(formatPanelNumber(2480)).toBe("2.480");
  });
});
