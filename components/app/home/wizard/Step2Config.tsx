import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, ShoppingBag, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buildPreview } from "@/lib/mock-data/wizard";
import type {
  BidStrategy,
  BudgetPeriod,
  CampaignType,
  NomenclatureToken,
  Structure,
  WizardStatus,
} from "@/lib/stores/wizardStore";
import { BidStrategyCard } from "./BidStrategyCard";
import { CampaignTypeCard } from "./CampaignTypeCard";
import { NomenclatureEditor } from "./NomenclatureEditor";
import { StepFooter } from "./StepFooter";

interface Step2ConfigProps {
  campaignType: CampaignType;
  budget: number;
  budgetPeriod: BudgetPeriod;
  bidStrategy: BidStrategy;
  bidLimit?: number;
  roasTarget?: number;
  objective: string;
  pixelId: string;
  status: WizardStatus;
  structure: Structure;
  customStructure: { campaigns: number; adsets: number; ads: number };
  nomenclatureTokens: NomenclatureToken[];
  nomenclaturePreview: string;
  pixelOptions: { id: string; name: string }[];
  onSetCampaignType: (value: CampaignType) => void;
  onSetBudget: (value: number) => void;
  onSetBudgetPeriod: (value: BudgetPeriod) => void;
  onSetBidStrategy: (value: BidStrategy) => void;
  onSetBidLimit: (value: number | undefined) => void;
  onSetRoasTarget: (value: number | undefined) => void;
  onSetObjective: (value: string) => void;
  onSetPixelId: (value: string) => void;
  onSetStatus: (value: WizardStatus) => void;
  onSetStructure: (value: Structure) => void;
  onSetCustomStructure: (value: Partial<{ campaigns: number; adsets: number; ads: number }>) => void;
  onSetNomenclatureTokens: (tokens: NomenclatureToken[]) => void;
  onSetNomenclaturePreview: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const objectives = [
  "OUTCOME_SALES",
  "OUTCOME_TRAFFIC",
  "OUTCOME_LEADS",
  "OUTCOME_AWARENESS",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_APP_PROMOTION",
];

export function Step2Config(props: Step2ConfigProps) {
  const {
    campaignType,
    budget,
    budgetPeriod,
    bidStrategy,
    bidLimit,
    roasTarget,
    objective,
    pixelId,
    status,
    structure,
    customStructure,
    nomenclatureTokens,
    nomenclaturePreview,
    pixelOptions,
    onSetCampaignType,
    onSetBudget,
    onSetBudgetPeriod,
    onSetBidStrategy,
    onSetBidLimit,
    onSetRoasTarget,
    onSetObjective,
    onSetPixelId,
    onSetStatus,
    onSetStructure,
    onSetCustomStructure,
    onSetNomenclatureTokens,
    onSetNomenclaturePreview,
    onPrev,
    onNext,
  } = props;

  return (
    <>
      <div className="space-y-5 p-6">
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo de campanha</h4>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <CampaignTypeCard
              selected={campaignType === "CBO"}
              onClick={() => onSetCampaignType("CBO")}
              icon={<LayoutGrid className="h-4 w-4" />}
              title="CBO"
              description="Facebook otimiza distribuição entre os conjuntos"
            />
            <CampaignTypeCard
              selected={campaignType === "ABO"}
              onClick={() => onSetCampaignType("ABO")}
              icon={<Sliders className="h-4 w-4" />}
              title="ABO"
              description="Orçamento por conjunto individualmente"
            />
            <CampaignTypeCard
              selected={campaignType === "DPA"}
              onClick={() => onSetCampaignType("DPA")}
              icon={<ShoppingBag className="h-4 w-4" />}
              title="Catálogo DPA"
              description="Dynamic Product Ads"
              badge={
                <Badge variant="success" className="text-[10px]">
                  Anti-Spy
                </Badge>
              }
            />
          </div>
        </section>

        <section className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[1fr_180px]">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Orçamento da campanha</h4>
            <div className="mt-2 flex items-center rounded-lg border border-gray-300 bg-white">
              <span className="px-3 text-sm text-gray-500">R$</span>
              <input
                type="number"
                min={6}
                value={budget}
                onChange={(event) => onSetBudget(Number(event.target.value))}
                className="w-full bg-transparent py-2 text-sm text-gray-900 outline-none"
              />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Periodicidade</h4>
            <select
              value={budgetPeriod}
              onChange={(event) => onSetBudgetPeriod(event.target.value as BudgetPeriod)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              <option value="daily">Diário</option>
              <option value="lifetime">Vitalício</option>
            </select>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Estratégia de lance</h4>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <BidStrategyCard
              selected={bidStrategy === "LOWEST_COST"}
              onClick={() => onSetBidStrategy("LOWEST_COST")}
              title="Maior volume"
              description="Máximo de resultados"
            />
            <BidStrategyCard
              selected={bidStrategy === "COST_CAP"}
              onClick={() => onSetBidStrategy("COST_CAP")}
              title="Meta de custo"
              description="Custo por resultado"
              badge="BETA"
            />
            <BidStrategyCard
              selected={bidStrategy === "BID_CAP"}
              onClick={() => onSetBidStrategy("BID_CAP")}
              title="Bid cap"
              description="Lance máximo por leilão"
              badge="BETA"
            />
            <BidStrategyCard
              selected={bidStrategy === "ROAS"}
              onClick={() => onSetBidStrategy("ROAS")}
              title="Meta de ROAS"
              description="Retorno mínimo esperado"
              badge="BETA"
            />
          </div>

          <AnimatePresence>
            {bidStrategy !== "LOWEST_COST" ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-3 rounded-lg border border-gray-300 bg-white p-3"
              >
                <label className="text-xs uppercase tracking-wider text-gray-500">
                  {bidStrategy === "ROAS" ? "Meta de ROAS" : "Limite de lance (BRL)"}
                </label>
                <input
                  type="number"
                  value={bidStrategy === "ROAS" ? roasTarget ?? "" : bidLimit ?? ""}
                  onChange={(event) =>
                    bidStrategy === "ROAS"
                      ? onSetRoasTarget(event.target.value ? Number(event.target.value) : undefined)
                      : onSetBidLimit(event.target.value ? Number(event.target.value) : undefined)
                  }
                  className="mt-2 w-44 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Nomenclatura</h4>
          <NomenclatureEditor
            tokens={nomenclatureTokens}
            preview={nomenclaturePreview}
            onTokensChange={(tokens) => {
              onSetNomenclatureTokens(tokens);
              onSetNomenclaturePreview(buildPreview(tokens));
            }}
          />
        </section>

        <section className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 lg:grid-cols-2">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Objetivo</h4>
            <select
              value={objective}
              onChange={(event) => onSetObjective(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              {objectives.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pixel</h4>
            <select
              value={pixelId}
              onChange={(event) => onSetPixelId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              <option value="">Selecionar pixel...</option>
              {pixelOptions.map((pixel) => (
                <option key={pixel.id} value={pixel.id}>
                  {pixel.name} ({pixel.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Estrutura</h4>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(["1-1-1", "1-3-5", "1-50-1", "custom"] as Structure[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSetStructure(item)}
                  className={`rounded-md border px-2 py-1.5 text-xs ${
                    item === structure
                      ? "border-[#7132f5] bg-[#7132f5] text-white"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            {structure === "custom" ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["campaigns", "adsets", "ads"] as const).map((key) => (
                  <input
                    key={key}
                    type="number"
                    min={1}
                    value={customStructure[key]}
                    onChange={(event) => onSetCustomStructure({ [key]: Number(event.target.value) })}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
                  />
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status inicial</h4>
            <div className="mt-2 flex gap-2">
              {(["ACTIVE", "PAUSED"] as WizardStatus[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSetStatus(value)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    status === value
                      ? "border-brand-purple bg-[rgba(113,50,245,0.12)] text-brand-purple-dark font-medium"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}
                >
                  {value === "ACTIVE" ? "Ativa" : "Pausada"}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
      <StepFooter
        left={
          <Button variant="ghost" className="text-sm" onClick={onPrev}>
            ← Voltar
          </Button>
        }
        right={
          <Button className="px-5 py-2.5 text-sm" onClick={onNext}>
            Continuar → Público & Revisão
          </Button>
        }
      />
    </>
  );
}
