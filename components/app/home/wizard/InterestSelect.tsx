"use client";

import { useMemo } from "react";
import AsyncSelect from "react-select/async";
import type { GroupBase, MultiValue, StylesConfig } from "react-select";
import type { PublicoInterest } from "@/lib/stores/wizardStore";
import type { InterestOption } from "@/lib/meta/types";

const SEARCH_DEBOUNCE_MS = 350;

type InterestSelectProps = {
  value: PublicoInterest[];
  onChange: (value: PublicoInterest[]) => void;
  styles: StylesConfig<InterestOption, true, GroupBase<InterestOption>>;
};

function formatAudience(value?: number) {
  if (!value) return null;
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function InterestSelect({ value, onChange, styles }: InterestSelectProps) {
  const loadOptions = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (inputValue: string, callback: (options: InterestOption[]) => void) => {
      if (timeout) clearTimeout(timeout);
      const query = inputValue.trim();
      if (query.length < 2) {
        callback([]);
        return;
      }

      timeout = setTimeout(async () => {
        try {
          const response = await fetch("/api/meta/targeting/interests", {
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

          const payload = (await response.json()) as { data?: InterestOption[] };
          callback(payload.data ?? []);
        } catch {
          callback([]);
        }
      }, SEARCH_DEBOUNCE_MS);
    };
  }, []);

  return (
    <AsyncSelect<InterestOption, true>
      isMulti
      className="mt-2 text-sm"
      cacheOptions
      defaultOptions={false}
      placeholder="Buscar interesses..."
      styles={styles}
      value={value.map((interest) => ({ value: interest.id, label: interest.name }))}
      loadOptions={loadOptions}
      formatOptionLabel={(option) => (
        <div className="flex items-center justify-between gap-2">
          <span>{option.label}</span>
          {option.audience_size ? (
            <span className="text-xs text-gray-500">Publico: {formatAudience(option.audience_size)}</span>
          ) : null}
        </div>
      )}
      onChange={(selected: MultiValue<InterestOption>) => {
        onChange(selected.map((item) => ({ id: item.value, name: item.label })));
      }}
      noOptionsMessage={({ inputValue }) =>
        inputValue.trim().length < 2 ? "Digite pelo menos 2 caracteres" : "Nenhum interesse encontrado"
      }
    />
  );
}
