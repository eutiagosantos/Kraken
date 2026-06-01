/** Meta Marketing API expects `start_time` / `end_time` as `YYYY-MM-DDThh:mm:ss+0000` (UTC offset). */

export type MetaLifetimeWindow = { startTime: string; endTime: string };

export function formatMetaDateTimeUtcOffset(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}-${mo}-${day}T${h}:${mi}:${s}+0000`;
}

/** Default flight for lifetime budgets: `days` from now (UTC +0000). */
export function defaultLifetimeSchedule(days = 30): MetaLifetimeWindow {
  const start = new Date();
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return {
    startTime: formatMetaDateTimeUtcOffset(start),
    endTime: formatMetaDateTimeUtcOffset(end),
  };
}
