import type { Publico } from "@/lib/stores/wizardStore";

const MSG_PT =
  "Adiciona pelo menos um país (código de 2 letras, ex.: BR, PT) e pelo menos uma região ou estado nas localidades.";

export type PublicoLocationsSlice = Pick<Publico, "locations">;

/** True when audience has at least one ISO-2 country and at least one state/region (Meta `region` stored as `state`). */
export function publicoHasCountryAndRegion(publico: PublicoLocationsSlice): boolean {
  let hasCountry = false;
  let hasRegion = false;
  for (const loc of publico.locations) {
    const key = loc.key?.trim() ?? "";
    if (loc.type === "country" && key.length === 2 && /^[a-z]{2}$/i.test(key)) {
      hasCountry = true;
    } else if (loc.type === "state" || loc.type === "region") {
      if (key.length > 0) hasRegion = true;
    }
  }
  return hasCountry && hasRegion;
}

export function publicoCountryRegionRequirementMessagePt(): string {
  return MSG_PT;
}
