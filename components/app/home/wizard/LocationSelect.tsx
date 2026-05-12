"use client";

import { useMemo } from "react";
import AsyncSelect from "react-select/async";
import type { GroupBase, MultiValue, StylesConfig } from "react-select";
import type { Localidade } from "@/lib/stores/wizardStore";
import type { LocationOption } from "@/lib/meta/types";

const SEARCH_DEBOUNCE_MS = 350;

function isSubnationalLocalidade(l: Localidade): boolean {
  return l.type === "state" || l.type === "region" || l.type === "city";
}

/** When country rows and sub-national rows are both selected, keep only the mode implied by the last pick. */
function resolveLocalidadesModeConflict(parsed: Localidade[]): Localidade[] {
  const hasCountry = parsed.some((l) => l.type === "country");
  const hasSub = parsed.some(isSubnationalLocalidade);
  if (!hasCountry || !hasSub) return parsed;
  const last = parsed[parsed.length - 1];
  if (isSubnationalLocalidade(last)) {
    return parsed.filter(isSubnationalLocalidade);
  }
  return parsed.filter((l) => l.type === "country");
}

type LocationSelectProps = {
  value: Localidade[];
  onChange: (value: Localidade[]) => void;
  styles: StylesConfig<LocationOption, true, GroupBase<LocationOption>>;
};

function locationOptionToLocalidade(item: LocationOption): Localidade {
  return {
    key: item.key,
    name: item.label,
    type: item.type === "region" ? "state" : item.type,
  };
}

export function LocationSelect({ value, onChange, styles }: LocationSelectProps) {
  const loadOptions = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (inputValue: string, callback: (options: LocationOption[]) => void) => {
      if (timeout) clearTimeout(timeout);
      const query = inputValue.trim();
      if (query.length < 2) {
        callback([]);
        return;
      }

      timeout = setTimeout(async () => {
        try {
          const response = await fetch("/api/meta/targeting/locations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-api-key": process.env.NEXT_PUBLIC_META_TARGETING_INTERNAL_API_KEY ?? "",
            },
            body: JSON.stringify({ q: query }),
          });

          if (!response.ok) {
            callback([]);
            return;
          }

          const payload = (await response.json()) as { data?: LocationOption[] };
          callback(payload.data ?? []);
        } catch {
          callback([]);
        }
      }, SEARCH_DEBOUNCE_MS);
    };
  }, []);

  return (
    <AsyncSelect<LocationOption, true>
      isMulti
      className="mt-2 text-sm"
      cacheOptions
      defaultOptions={false}
      placeholder="Buscar países, regiões, cidades..."
      styles={styles}
      value={value.map((location) => ({
        value: location.key,
        key: location.key,
        label: location.name,
        type: location.type === "state" ? "region" : location.type,
      }))}
      loadOptions={loadOptions}
      formatOptionLabel={(option) => (
        <div className="flex items-center justify-between gap-2">
          <span>{option.label}</span>
          <span className="text-xs uppercase text-gray-500">{option.type}</span>
        </div>
      )}
      onChange={(selected: MultiValue<LocationOption>) => {
        const parsed = resolveLocalidadesModeConflict(selected.map(locationOptionToLocalidade));
        onChange(parsed);
      }}
      noOptionsMessage={({ inputValue }) =>
        inputValue.trim().length < 2 ? "Digite pelo menos 2 caracteres" : "Nenhuma localidade encontrada"
      }
    />
  );
}
