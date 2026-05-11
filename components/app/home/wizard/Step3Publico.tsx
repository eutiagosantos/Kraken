import CreatableSelect from "react-select/creatable";
import { DollarSign, ImageIcon, Layers, Rocket, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Publico } from "@/lib/stores/wizardStore";
import { PublicosSalvosGrid } from "./PublicosSalvosGrid";
import { ReviewCard } from "./ReviewCard";
import { StepFooter } from "./StepFooter";
import { SummaryRow } from "./SummaryRow";

interface SelectOption {
  value: string;
  label: string;
}

interface LocationOption extends SelectOption {
  type: "country" | "state" | "city";
}

interface Step3PublicoProps {
  publico: Publico;
  publicoTab: "custom" | "salvos";
  savedPublicos: Publico[];
  locationOptions: LocationOption[];
  interestOptions: SelectOption[];
  selectedAccountCount: number;
  creativeCount: number;
  campaignType: "CBO" | "ABO" | "DPA";
  objective: string;
  bidStrategy: string;
  structure: string;
  status: "ACTIVE" | "PAUSED";
  budget: number;
  estimatedCampaigns: number;
  publishing: boolean;
  darkSelectStyles: Record<string, unknown>;
  onSetPublicoTab: (tab: "custom" | "salvos") => void;
  onSetPublico: (publico: Partial<Publico>) => void;
  onLoadPublico: (publico: Publico) => void;
  onDeletePublico: (id: string) => void;
  onSavePublico: () => void;
  onPrev: () => void;
  onPublish: () => void;
}

export function Step3Publico(props: Step3PublicoProps) {
  const {
    publico,
    publicoTab,
    savedPublicos,
    locationOptions,
    interestOptions,
    selectedAccountCount,
    creativeCount,
    campaignType,
    objective,
    bidStrategy,
    structure,
    status,
    budget,
    estimatedCampaigns,
    publishing,
    darkSelectStyles,
    onSetPublicoTab,
    onSetPublico,
    onLoadPublico,
    onDeletePublico,
    onSavePublico,
    onPrev,
    onPublish,
  } = props;

  return (
    <>
      <div className="space-y-5 p-6">
        <div className="flex gap-2">
          <Button variant={publicoTab === "custom" ? "subtle" : "ghost"} onClick={() => onSetPublicoTab("custom")}>
            Público custom
          </Button>
          <Button variant={publicoTab === "salvos" ? "subtle" : "ghost"} onClick={() => onSetPublicoTab("salvos")}>
            Públicos salvos
          </Button>
        </div>

        {publicoTab === "custom" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4">
              <div className="rounded-xl border border-[#1e2130] bg-[#141720] p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#686b82]">Localidade</h4>
                <CreatableSelect
                  isMulti
                  className="mt-2 text-sm"
                  placeholder="Buscar países, estados, cidades..."
                  options={locationOptions}
                  styles={darkSelectStyles}
                  value={publico.locations.map((location) => ({
                    value: location.key,
                    label: location.name,
                    type: location.type,
                  }))}
                  onChange={(options) => {
                    const values = options.map((option) => ({
                      type: (option as LocationOption).type ?? "city",
                      key: option.value,
                      name: option.label,
                    }));
                    onSetPublico({ locations: values });
                  }}
                />
              </div>

              <div className="rounded-xl border border-[#1e2130] bg-[#141720] p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#686b82]">Faixa etária</h4>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="number"
                    min={18}
                    max={65}
                    value={publico.ageMin}
                    onChange={(event) => onSetPublico({ ageMin: Number(event.target.value) })}
                    className="w-24 rounded-md border border-[#1e2130] bg-[#0d0f14] px-2 py-1.5 text-sm text-white"
                  />
                  <span className="text-[#686b82]">até</span>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    value={publico.ageMax}
                    onChange={(event) => onSetPublico({ ageMax: Number(event.target.value) })}
                    className="w-24 rounded-md border border-[#1e2130] bg-[#0d0f14] px-2 py-1.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#1e2130] bg-[#141720] p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#686b82]">Gênero</h4>
                <div className="mt-2 flex gap-2">
                  {[
                    { value: "all", label: "Todos" },
                    { value: "male", label: "Masculino" },
                    { value: "female", label: "Feminino" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        publico.gender === item.value
                          ? "border-[#7132f5] bg-[rgba(113,50,245,0.2)] text-white"
                          : "border-[#1e2130] bg-[#0d0f14] text-[#686b82]"
                      }`}
                      onClick={() => onSetPublico({ gender: item.value as Publico["gender"] })}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-xl border border-[#1e2130] bg-[#141720] p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#686b82]">Interesses</h4>
                <CreatableSelect
                  isMulti
                  className="mt-2 text-sm"
                  placeholder="Buscar interesses..."
                  options={interestOptions}
                  styles={darkSelectStyles}
                  value={publico.interests.map((interest) => ({ value: interest.id, label: interest.name }))}
                  onChange={(options) =>
                    onSetPublico({
                      interests: options.map((option) => ({ id: option.value, name: option.label })),
                    })
                  }
                />
              </div>
              <div className="rounded-xl border border-[#1e2130] bg-[#141720] p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#686b82]">Dispositivos</h4>
                <div className="mt-2 flex gap-2">
                  {(["mobile", "desktop"] as const).map((device) => (
                    <button
                      key={device}
                      type="button"
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        publico.devices.includes(device)
                          ? "border-[#7132f5] bg-[rgba(113,50,245,0.2)] text-white"
                          : "border-[#1e2130] bg-[#0d0f14] text-[#686b82]"
                      }`}
                      onClick={() =>
                        onSetPublico({
                          devices: publico.devices.includes(device)
                            ? publico.devices.filter((item) => item !== device)
                            : [...publico.devices, device],
                        })
                      }
                    >
                      {device}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-[#1e2130] bg-[#141720] p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#686b82]">Plataformas</h4>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["facebook", "instagram", "audience_network", "messenger"] as const).map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        publico.platforms.includes(platform)
                          ? "border-[#7132f5] bg-[rgba(113,50,245,0.2)] text-white"
                          : "border-[#1e2130] bg-[#0d0f14] text-[#686b82]"
                      }`}
                      onClick={() =>
                        onSetPublico({
                          platforms: publico.platforms.includes(platform)
                            ? publico.platforms.filter((item) => item !== platform)
                            : [...publico.platforms, platform],
                        })
                      }
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>
              <Button variant="outlined" onClick={onSavePublico}>
                Salvar como público reutilizável
              </Button>
            </section>
          </div>
        ) : (
          <PublicosSalvosGrid publicos={savedPublicos} onSelect={onLoadPublico} onDelete={onDeletePublico} />
        )}

        <section className="rounded-xl border border-[#1e2130] bg-[#141720] p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#686b82]">Revisão final</h4>
          <div className="mt-3 grid gap-3 lg:grid-cols-4">
            <ReviewCard icon={<Users className="h-4 w-4" />} label="Contas" value={selectedAccountCount} />
            <ReviewCard icon={<ImageIcon className="h-4 w-4" />} label="Criativos" value={creativeCount} />
            <ReviewCard icon={<Layers className="h-4 w-4" />} label="Campanhas est." value={estimatedCampaigns} />
            <ReviewCard icon={<DollarSign className="h-4 w-4" />} label="Budget/dia" value={`R$ ${budget}`} />
          </div>
          <div className="mt-4 rounded-lg border border-[#1e2130] bg-[#0d0f14] p-3">
            <SummaryRow label="Tipo" value={campaignType} />
            <SummaryRow label="Objetivo" value={objective} />
            <SummaryRow label="Lance" value={bidStrategy} />
            <SummaryRow label="Estrutura" value={structure} />
            <SummaryRow label="Status" value={status} />
            <SummaryRow
              label="Público"
              value={`${publico.ageMin}-${publico.ageMax} anos • ${publico.gender} • ${publico.platforms.join(", ")}`}
            />
            {publico.locations.length ? (
              <SummaryRow label="Localidades" value={publico.locations.map((location) => location.name).join(", ")} />
            ) : null}
          </div>
          {campaignType === "DPA" ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[rgba(20,158,97,0.2)] bg-[rgba(20,158,97,0.08)] p-3">
              <ShieldCheck className="h-4 w-4 text-[#149e61]" />
              <span className="text-sm font-medium text-[#149e61]">Modo Anti-Spy ativado</span>
            </div>
          ) : null}
        </section>
      </div>
      <StepFooter
        left={
          <Button variant="ghost" onClick={onPrev}>
            ← Voltar
          </Button>
        }
        right={
          <Button onClick={onPublish} disabled={publishing} className="min-w-64">
            <Rocket className="h-4 w-4" /> Publicar {estimatedCampaigns} Campanhas
          </Button>
        }
      />
    </>
  );
}
