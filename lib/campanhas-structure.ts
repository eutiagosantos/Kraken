/** Preset slugs stored in `campanhas.structure` from wizard publish. */
export const CAMPANHA_STRUCTURE_PRESETS = ["1-50-1", "1-250-1", "1-3-5", "1-1-5"] as const;

export type CampanhaStructurePreset = (typeof CAMPANHA_STRUCTURE_PRESETS)[number];

const PRESET_SET = new Set<string>(CAMPANHA_STRUCTURE_PRESETS);

export function isCampanhaStructurePreset(s: string): s is CampanhaStructurePreset {
  return PRESET_SET.has(s);
}

/** Human-readable structure label for UI (matches wizard nomenclature / fila `structureDisplay`). */
export function campanhaStructureDisplay(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("custom:")) {
    const suffix = trimmed.slice("custom:".length);
    return suffix || trimmed;
  }
  if (isCampanhaStructurePreset(trimmed)) return trimmed;
  return trimmed;
}
