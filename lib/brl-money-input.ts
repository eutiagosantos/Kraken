const intlBrl = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Keeps only valid pt-BR money typing: digits, at most one `,` as decimal separator,
 * optional `.` as thousands separator on the integer side; max 2 fractional digits.
 */
export function sanitizeBrlTyping(raw: string): string {
  const s = raw.replace(/[^\d.,]/g, "");
  const commaIdx = s.indexOf(",");
  const left = commaIdx === -1 ? s : s.slice(0, commaIdx);
  const right = commaIdx === -1 ? "" : s.slice(commaIdx + 1).replace(/[^\d]/g, "").slice(0, 2);
  const leftClean = left.replace(/[^\d.]/g, "").replace(/\.+/g, ".");
  if (commaIdx !== -1) {
    return `${leftClean},${right}`;
  }
  return leftClean;
}

/**
 * Parses pt-BR amount string to number. `undefined` if empty / not a finite number.
 * Accepts trailing `,` (e.g. `"12,"` → `12`).
 */
export function parseBrlToNumber(s: string): number | undefined {
  const trimmed = s.trim();
  if (!trimmed) return undefined;

  const commaIdx = trimmed.indexOf(",");
  if (commaIdx === -1) {
    const intDigits = trimmed.replace(/\./g, "");
    if (!intDigits) return undefined;
    const n = Number(intDigits);
    return Number.isFinite(n) ? n : undefined;
  }

  const intRaw = trimmed.slice(0, commaIdx);
  const fracRaw = trimmed.slice(commaIdx + 1).replace(/[^\d]/g, "").slice(0, 2);
  const intDigits = intRaw.replace(/\./g, "");
  if (!intDigits && !fracRaw) return undefined;

  const core = fracRaw.length > 0 ? `${intDigits || "0"}.${fracRaw}` : intDigits;
  const n = Number(core);
  return Number.isFinite(n) ? n : undefined;
}

/** Formatted integer + decimal part for input (no R$ symbol). */
export function formatBrlInputValue(n: number): string {
  return intlBrl.format(n);
}
