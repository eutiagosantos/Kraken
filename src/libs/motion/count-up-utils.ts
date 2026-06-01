export type ParsedCountUp =
  | { kind: "numeric"; end: number; decimals: number }
  | { kind: "static"; value: string };

export function parseCountUpEnd(end: number | string): ParsedCountUp {
  if (typeof end === "number") {
    return { kind: "numeric", end, decimals: 0 };
  }

  const trimmed = end.trim();

  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    const decimals = trimmed.includes(".")
      ? trimmed.split(".")[1]?.length ?? 0
      : 0;

    return {
      kind: "numeric",
      end: Number.parseFloat(trimmed),
      decimals,
    };
  }

  return { kind: "static", value: trimmed };
}

export function formatCountUpValue(value: number, decimals: number): string {
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}
