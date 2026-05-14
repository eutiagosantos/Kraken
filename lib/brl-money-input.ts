const intlBrl = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const intlIntegerPtBr = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
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

/**
 * Applies pt-BR thousand separators while typing (after {@link sanitizeBrlTyping}).
 * Keeps trailing `,` and fractional digits so the user can type decimals without fighting the mask.
 */
export function formatBrlTypingDisplay(sanitized: string): string {
  const s = sanitized.trim();
  if (!s) return "";

  const commaIdx = s.indexOf(",");
  const intRaw = commaIdx === -1 ? s : s.slice(0, commaIdx);
  const fracRaw = commaIdx === -1 ? "" : s.slice(commaIdx + 1);
  const intDigits = intRaw.replace(/\./g, "");

  if (!intDigits && fracRaw) {
    return `0,${fracRaw}`;
  }

  const hasTrailingComma = commaIdx !== -1 && fracRaw.length === 0;
  if (!intDigits && hasTrailingComma) {
    return "0,";
  }
  if (!intDigits) {
    return "";
  }

  const intNum = parseInt(intDigits, 10);
  if (!Number.isFinite(intNum)) {
    return "";
  }
  const intPart = intlIntegerPtBr.format(intNum);

  if (commaIdx === -1) {
    return intPart;
  }
  return `${intPart},${fracRaw}`;
}
