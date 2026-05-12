/** Meta Marketing API: deprecated detailed targeting interests with suggested replacements in `error.error_data`. */

export type DeprecatedInterestReplacement = {
  deprecatedId: string;
  alternativeId: string;
  deprecatedName?: string;
  alternativeName?: string;
};

function idString(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) return String(Math.trunc(v));
  if (typeof v === "string") {
    const t = v.trim();
    return t.length > 0 ? t : null;
  }
  return null;
}

function maybeName(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function walkErrorData(node: unknown, out: DeprecatedInterestReplacement[]): void {
  if (node == null) return;

  if (typeof node === "string") {
    const s = node.trim();
    if (s.startsWith("{") || s.startsWith("[")) {
      try {
        walkErrorData(JSON.parse(s) as unknown, out);
      } catch {
        /* ignore */
      }
    }
    return;
  }

  if (Array.isArray(node)) {
    for (const x of node) walkErrorData(x, out);
    return;
  }

  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    const dep = idString(o.deprecated_interest_id);
    const alt = idString(o.alternative_interest_id);
    if (dep && alt) {
      out.push({
        deprecatedId: dep,
        alternativeId: alt,
        deprecatedName: maybeName(o.deprecated_interest_name),
        alternativeName: maybeName(o.alternative_interest_name),
      });
    }
    for (const v of Object.values(o)) walkErrorData(v, out);
  }
}

/**
 * Extracts deprecated → alternative interest ID pairs from a Graph error JSON body.
 */
export function parseDeprecatedInterestReplacements(rawBody: string): DeprecatedInterestReplacement[] {
  const out: DeprecatedInterestReplacement[] = [];
  try {
    const j = JSON.parse(rawBody) as { error?: { error_data?: unknown } };
    walkErrorData(j?.error?.error_data, out);
  } catch {
    return [];
  }
  const seen = new Map<string, DeprecatedInterestReplacement>();
  for (const r of out) {
    seen.set(r.deprecatedId, r);
  }
  return Array.from(seen.values());
}

function interestIdToMetaValue(id: string): number | string {
  const t = id.trim();
  if (/^\d+$/.test(t)) return Number(t);
  return t;
}

function interestRowIdKey(row: { id?: unknown }): string | null {
  if (row.id == null) return null;
  if (typeof row.id === "number" && Number.isFinite(row.id)) return String(Math.trunc(row.id));
  if (typeof row.id === "string") {
    const t = row.id.trim();
    return t.length > 0 ? t : null;
  }
  return null;
}

/**
 * Replaces deprecated interest IDs inside `targeting.flexible_spec[].interests`.
 * Deduplicates by interest id after replacement.
 */
export function applyInterestReplacementsToTargeting(
  targeting: Record<string, unknown>,
  replacements: Map<string, string>
): { changed: boolean } {
  if (replacements.size === 0) return { changed: false };

  const spec = targeting.flexible_spec;
  if (!Array.isArray(spec)) return { changed: false };

  let anyChanged = false;
  const nextSpec = spec.map((block) => {
    if (typeof block !== "object" || block == null) return block;
    const b = block as Record<string, unknown>;
    const interests = b.interests;
    if (!Array.isArray(interests)) return block;

    const nextRows: Array<{ id: number | string }> = [];
    const seenIds = new Set<string>();

    for (const row of interests) {
      if (typeof row !== "object" || row == null) continue;
      const r = row as { id?: unknown };
      const key = interestRowIdKey(r);
      if (!key) continue;
      const alt = replacements.get(key);
      const finalId = alt ?? key;
      const metaVal = interestIdToMetaValue(finalId);
      const dedupeKey = String(metaVal);
      if (seenIds.has(dedupeKey)) continue;
      seenIds.add(dedupeKey);
      nextRows.push({ id: metaVal });
    }

    const prevSig = interests
      .map((row) => (typeof row === "object" && row != null ? interestRowIdKey(row as { id?: unknown }) : null))
      .filter((k): k is string => k != null)
      .join(",");
    const newSig = nextRows.map((r) => String(r.id)).join(",");
    if (prevSig === newSig) return block;

    anyChanged = true;
    return { ...b, interests: nextRows };
  });

  if (anyChanged) {
    targeting.flexible_spec = nextSpec;
  }

  return { changed: anyChanged };
}

/** Build a replacement map (last wins for duplicate deprecated IDs). */
export function replacementsToMap(rows: DeprecatedInterestReplacement[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of rows) {
    m.set(r.deprecatedId, r.alternativeId);
  }
  return m;
}
