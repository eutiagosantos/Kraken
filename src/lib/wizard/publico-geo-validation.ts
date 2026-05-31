import type { Publico } from "@/lib/stores/wizardStore";

const HELP_PT =
  "Escolhe só país(és) (código ISO de 2 letras, ex.: BR, PT) ou só cidades, estados ou regiões — não mistures os dois na mesma lista.";

const MSG_MIXED_PT =
  "Não podes combinar país com cidade, estado ou região na mesma lista. Remove um dos lados ou deixa só um modo de localização.";

const MSG_EMPTY_PT =
  "Adiciona pelo menos um país (ISO de 2 letras) ou pelo menos uma cidade, estado ou região.";

export type PublicoLocationsSlice = Pick<Publico, "locations">;

function isIso2CountryKey(key: string): boolean {
  return key.length === 2 && /^[a-z]{2}$/i.test(key);
}

/** True if this row is a country entry with a non-empty key (used to detect forbidden mix with subnationals). */
function isCountryRow(loc: Publico["locations"][number]): boolean {
  return loc.type === "country" && (loc.key?.trim() ?? "").length > 0;
}

/** True if this row counts as a valid ISO-2 country for mode A. */
function isValidIsoCountryRow(loc: Publico["locations"][number]): boolean {
  return loc.type === "country" && isIso2CountryKey((loc.key ?? "").trim());
}

function isSubnationalRow(loc: Publico["locations"][number]): boolean {
  if (loc.type !== "state" && loc.type !== "region" && loc.type !== "city") return false;
  return (loc.key?.trim() ?? "").length > 0;
}

/**
 * Returns a Portuguese error message if `publico.locations` is invalid for publish, or `null` if valid.
 *
 * Valid modes (mutually exclusive):
 * - **A — Countries only:** at least one ISO-2 country row; no sub-national rows; no other country rows with keys.
 * - **B — Sub-national only:** at least one city/state/region with non-empty key; no country rows with any non-empty key.
 */
export function getPublicoGeoValidationErrorPt(publico: PublicoLocationsSlice): string | null {
  const locations = publico.locations ?? [];
  const hasSubnational = locations.some(isSubnationalRow);
  const hasAnyCountryRow = locations.some(isCountryRow);
  const hasValidIsoCountry = locations.some(isValidIsoCountryRow);

  if (hasAnyCountryRow && hasSubnational) {
    return MSG_MIXED_PT;
  }

  if (hasSubnational && !hasAnyCountryRow) {
    return null;
  }

  if (hasValidIsoCountry && !hasSubnational) {
    return null;
  }

  return MSG_EMPTY_PT;
}

export function publicoHasValidGeoLocations(publico: PublicoLocationsSlice): boolean {
  return getPublicoGeoValidationErrorPt(publico) === null;
}

/** Short help shown next to the location field in the wizard. */
export function publicoGeoHelpTextPt(): string {
  return HELP_PT;
}
