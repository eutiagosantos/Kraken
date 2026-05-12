import { z } from "zod";

import { defaultLifetimeSchedule, formatMetaDateTimeUtcOffset, type MetaLifetimeWindow } from "@/lib/meta/meta-datetime";

/** Meta `adset_schedule`: `days` 1 = Monday … 7 = Sunday (Marketing API). */
export const daypartSegmentSchema = z
  .object({
    days: z.array(z.number().int().min(1).max(7)).min(1),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(0).max(1439),
  })
  .refine((s) => s.endMinute > s.startMinute, {
    message: "A hora de fim deve ser depois da hora de início.",
    path: ["endMinute"],
  });

export const campaignScheduleSchema = z.object({
  flightMode: z.enum(["automatic", "custom_dates"]),
  flightStart: z.string().optional(),
  flightEnd: z.string().optional(),
  dayparting: z.object({
    enabled: z.boolean(),
    segments: z.array(daypartSegmentSchema).max(24),
  }),
  frequencyCap: z
    .object({
      intervalDays: z.number().int().min(1).max(90),
      maxImpressions: z.number().int().min(1).max(90),
    })
    .nullable()
    .optional(),
});

export type CampaignSchedule = z.infer<typeof campaignScheduleSchema>;

export function defaultCampaignSchedule(): CampaignSchedule {
  return {
    flightMode: "automatic",
    flightStart: undefined,
    flightEnd: undefined,
    dayparting: { enabled: false, segments: [] },
    frequencyCap: null,
  };
}

export function resolveLifetimeScheduleForPublish(
  budgetPeriod: "daily" | "lifetime",
  schedule: CampaignSchedule
): MetaLifetimeWindow | null {
  if (budgetPeriod !== "lifetime") return null;
  if (schedule.flightMode === "automatic") {
    return defaultLifetimeSchedule(30);
  }
  const start = new Date(schedule.flightStart ?? "");
  const end = new Date(schedule.flightEnd ?? "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return defaultLifetimeSchedule(30);
  }
  return {
    startTime: formatMetaDateTimeUtcOffset(start),
    endTime: formatMetaDateTimeUtcOffset(end),
  };
}

export type MetaAdsetScheduleRow = { days: number[]; start_minute: number; end_minute: number };

export function buildAdsetSchedulePayload(schedule: CampaignSchedule): MetaAdsetScheduleRow[] | undefined {
  if (!schedule.dayparting.enabled || schedule.dayparting.segments.length === 0) return undefined;
  return schedule.dayparting.segments.map((s) => ({
    days: s.days,
    start_minute: s.startMinute,
    end_minute: s.endMinute,
  }));
}

export type MetaFrequencyControlRow = { event: string; interval_days: number; max_frequency: number };

export function buildFrequencyControlSpecs(schedule: CampaignSchedule): MetaFrequencyControlRow[] | undefined {
  const cap = schedule.frequencyCap;
  if (!cap) return undefined;
  return [{ event: "IMPRESSIONS", interval_days: cap.intervalDays, max_frequency: cap.maxImpressions }];
}
