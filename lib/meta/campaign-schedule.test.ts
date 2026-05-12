import { describe, expect, it } from "vitest";

import {
  buildAdsetSchedulePayload,
  buildFrequencyControlSpecs,
  defaultCampaignSchedule,
  resolveDailyAdsetFlightForPublish,
  resolveLifetimeScheduleForPublish,
} from "@/lib/meta/campaign-schedule";

describe("resolveLifetimeScheduleForPublish", () => {
  it("returns 30d window for lifetime automatic", () => {
    const w = resolveLifetimeScheduleForPublish("lifetime", defaultCampaignSchedule());
    expect(w).not.toBeNull();
    expect(w!.startTime.endsWith("+0000")).toBe(true);
    expect(w!.endTime.endsWith("+0000")).toBe(true);
  });

  it("returns null for daily budget", () => {
    expect(resolveLifetimeScheduleForPublish("daily", defaultCampaignSchedule())).toBeNull();
  });

  it("uses custom ISO range when flightMode is custom_dates", () => {
    const start = new Date("2030-01-01T12:00:00.000Z");
    const end = new Date("2030-01-10T12:00:00.000Z");
    const w = resolveLifetimeScheduleForPublish("lifetime", {
      ...defaultCampaignSchedule(),
      flightMode: "custom_dates",
      flightStart: start.toISOString(),
      flightEnd: end.toISOString(),
    });
    expect(w).not.toBeNull();
    expect(w!.startTime.startsWith("2030-01-01")).toBe(true);
    expect(w!.endTime.startsWith("2030-01-10")).toBe(true);
  });
});

describe("resolveDailyAdsetFlightForPublish", () => {
  it("returns null when no start is set", () => {
    expect(resolveDailyAdsetFlightForPublish(defaultCampaignSchedule())).toBeNull();
  });

  it("returns start and end_time 0 when open-ended", () => {
    const w = resolveDailyAdsetFlightForPublish({
      ...defaultCampaignSchedule(),
      flightStart: new Date("2030-02-01T08:00:00.000Z").toISOString(),
      openEndedFlight: true,
    });
    expect(w).not.toBeNull();
    expect(w!.endTime).toBe(0);
    expect(w!.startTime.endsWith("+0000")).toBe(true);
  });

  it("returns start and formatted end when both set", () => {
    const w = resolveDailyAdsetFlightForPublish({
      ...defaultCampaignSchedule(),
      flightStart: new Date("2030-02-01T08:00:00.000Z").toISOString(),
      flightEnd: new Date("2030-02-05T08:00:00.000Z").toISOString(),
      openEndedFlight: false,
    });
    expect(w).not.toBeNull();
    expect(w!.startTime.startsWith("2030-02-01")).toBe(true);
    expect(w!.endTime).toMatch(/^2030-02-05/);
    expect(String(w!.endTime).endsWith("+0000")).toBe(true);
  });
});

describe("buildAdsetSchedulePayload", () => {
  it("returns undefined when dayparting off", () => {
    expect(buildAdsetSchedulePayload(defaultCampaignSchedule())).toBeUndefined();
  });

  it("maps segments to Meta snake_case", () => {
    const rows = buildAdsetSchedulePayload({
      ...defaultCampaignSchedule(),
      dayparting: {
        enabled: true,
        segments: [{ days: [1, 2], startMinute: 600, endMinute: 720 }],
      },
    });
    expect(rows).toEqual([{ days: [1, 2], start_minute: 600, end_minute: 720 }]);
  });
});

describe("buildFrequencyControlSpecs", () => {
  it("returns undefined when no cap", () => {
    expect(buildFrequencyControlSpecs(defaultCampaignSchedule())).toBeUndefined();
  });

  it("builds IMPRESSIONS spec", () => {
    const f = buildFrequencyControlSpecs({
      ...defaultCampaignSchedule(),
      frequencyCap: { intervalDays: 7, maxImpressions: 3 },
    });
    expect(f).toEqual([{ event: "IMPRESSIONS", interval_days: 7, max_frequency: 3 }]);
  });
});
