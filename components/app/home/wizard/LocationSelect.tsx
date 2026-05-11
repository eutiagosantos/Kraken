"use client";

import { useMemo } from "react";
import AsyncSelect from "react-select/async";
import type { GroupBase, MultiValue, StylesConfig } from "react-select";
import type { Localidade } from "@/lib/stores/wizardStore";
import type { LocationOption } from "@/lib/meta/types";

const SEARCH_DEBOUNCE_MS = 350;

type LocationSelectProps = {
  value: Localidade[];
  onChange: (value: Localidade[]) => void;
  styles: StylesConfig<LocationOption, true, GroupBase<LocationOption>>;
};

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
        const parsed = selected.map((item) => ({
          key: item.key,
          name: item.label,
          type: item.type === "region" ? "state" : item.type,
        }));
        onChange(parsed);
      }}
      noOptionsMessage={({ inputValue }) =>
        inputValue.trim().length < 2 ? "Digite pelo menos 2 caracteres" : "Nenhuma localidade encontrada"
      }
    />
  );
}
