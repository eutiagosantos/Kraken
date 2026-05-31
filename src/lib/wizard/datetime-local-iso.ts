/** Bridge `datetime-local` inputs (no timezone) ↔ ISO strings for the publish payload. */

export function isoToDatetimeLocalInput(iso: string): string {
  if (!iso.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function datetimeLocalInputToIso(value: string): string {
  if (!value.trim()) return "";
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return "";
  return new Date(ms).toISOString();
}

export function timeInputToMinutes(value: string): number {
  const [h, m] = value.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.min(1439, Math.max(0, h * 60 + m));
}

export function minutesToTimeInput(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
