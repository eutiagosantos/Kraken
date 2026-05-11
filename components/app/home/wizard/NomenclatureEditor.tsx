import { useMemo, useState } from "react";
import { Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { mockSavedPresets } from "@/lib/mock-data/wizard";
import type { NomenclatureToken } from "@/lib/stores/wizardStore";
import { VariableChip } from "./VariableChip";
import { VariableGroup } from "./VariableGroup";

interface NomenclatureEditorProps {
  tokens: NomenclatureToken[];
  preview: string;
  onTokensChange: (tokens: NomenclatureToken[]) => void;
}

const variableCatalog = {
  CONTA: [
    { label: "Conta (Nome)", value: "{{conta_nome}}", color: "#7132f5" },
    { label: "Conta (Apelido)", value: "{{conta_apelido}}", color: "#7132f5" },
    { label: "Conta (ID)", value: "{{conta_id}}", color: "#7132f5" },
  ],
  CAMPANHA: [
    { label: "Budget CBO", value: "{{budget}}", color: "#d97706" },
    { label: "Estrutura", value: "{{estrutura}}", color: "#d97706" },
    { label: "Pixel", value: "{{pixel}}", color: "#d97706" },
    { label: "Objetivo", value: "{{objetivo}}", color: "#d97706" },
  ],
  CRIATIVOS: [
    { label: "Criativo", value: "{{criativo}}", color: "#149e61" },
    { label: "Catálogo", value: "{{catalogo}}", color: "#149e61" },
  ],
  SEQUENCIAL: [{ label: "Sequencial", value: "{{seq}}", color: "#0ea5e9" }],
} as const;

export function NomenclatureEditor({ tokens, preview, onTokensChange }: NomenclatureEditorProps) {
  const [textValue, setTextValue] = useState("");

  const tokenCount = useMemo(() => tokens.length, [tokens.length]);

  const addVariable = (value: string, label: string, color?: string) => {
    onTokensChange([...tokens, { type: "variable", value, label, color }]);
  };

  const addTextToken = () => {
    if (!textValue.trim()) return;
    onTokensChange([...tokens, { type: "text", value: textValue }]);
    setTextValue("");
  };

  const removeToken = (index: number) => {
    onTokensChange(tokens.filter((_, tokenIndex) => tokenIndex !== index));
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-xs uppercase tracking-wider text-gray-500">Variáveis</p>
        {Object.entries(variableCatalog).map(([group, entries]) => (
          <VariableGroup key={group} title={group}>
            {entries.map((entry) => (
              <VariableChip
                key={entry.value}
                label={entry.label}
                value={entry.value}
                color={entry.color}
                onClick={addVariable}
              />
            ))}
          </VariableGroup>
        ))}
      </aside>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Wand2 className="h-4 w-4 text-[#9b72ff]" />
            Nomenclatura
          </p>
          <select
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"
            onChange={(event) => {
              const preset = mockSavedPresets.find((item) => item.id === event.target.value);
              if (preset) onTokensChange(preset.tokens);
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Preset
            </option>
            {mockSavedPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-300 bg-gray-50 p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {tokens.map((token, index) => (
              <span
                key={`${token.type}-${token.value}-${index}`}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-900"
                style={{ backgroundColor: token.type === "variable" ? `${token.color ?? "#7132f5"}33` : "#ffffff" }}
              >
                {token.type === "variable" ? `[${token.label ?? token.value}]` : token.value}
                <button type="button" onClick={() => removeToken(index)} className="text-gray-500 hover:text-gray-900">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTextToken();
                }
              }}
              placeholder="Digite texto e aperte Enter"
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-[#7132f5]"
            />
            <Button variant="subtle" className="px-3 py-1.5 text-sm" onClick={addTextToken}>
              Add
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Use os chips de variáveis ou texto livre. Tokens: {tokenCount}</p>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Preview</p>
          <div className="rounded-lg border border-[rgba(113,50,245,0.2)] bg-[rgba(113,50,245,0.08)] px-3 py-2">
            <span className="font-mono text-sm text-[#9b72ff]">{preview || "—"}</span>
          </div>
          <p className="mt-1 text-right text-xs text-gray-500">{preview.length} caracteres</p>
        </div>
      </section>
    </div>
  );
}
