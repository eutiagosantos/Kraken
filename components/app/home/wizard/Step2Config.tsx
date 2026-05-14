import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { LayoutGrid, Loader2, ShoppingBag, Sliders } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  BidStrategy,
  BudgetPeriod,
  CampaignType,
  CatalogCustomEventChoice,
  NomenclatureToken,
  Structure,
  WizardStatus,
} from "@/lib/stores/wizardStore";
import type { CampaignSchedule } from "@/lib/meta/campaign-schedule";
import type { WizardAdSetBillingEvent } from "@/lib/meta/billing-event";
import {
  defaultBillingEventForOptimizationGoal,
  validBillingEventsForOptimizationGoal,
} from "@/lib/meta/billing-event";
import { selectOptimizationForObjective } from "@/lib/meta/map-wizard-to-graph";
import {
  buildNomenclaturePreview,
  type NomenclaturePreviewContext,
} from "@/lib/wizard/nomenclature-preview";
import { CurrencyInputBrl } from "@/components/ui/CurrencyInputBrl";
import { BidStrategyCard } from "./BidStrategyCard";
import { CampaignTypeCard } from "./CampaignTypeCard";
import { NomenclatureEditor } from "./NomenclatureEditor";
import { Step2Schedule } from "./Step2Schedule";
import { StepFooter } from "./StepFooter";

interface Step2ConfigProps {
  /** Número de ficheiros criativos no passo 1 — usado só para dica de estrutura 1-N-1. */
  creativeCount?: number;
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
  nomenclaturePreviewContext: NomenclaturePreviewContext;
  pixelOptions: { id: string; name: string }[];
  pixelsLoading?: boolean;
  campaignSchedule: CampaignSchedule;
  adSetBillingEvent: WizardAdSetBillingEvent | null;
  onSetAdSetBillingEvent: (value: WizardAdSetBillingEvent | null) => void;
  onSetCampaignSchedule: (patch: Partial<CampaignSchedule>) => void;
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
  destinationUrl: string;
  onSetDestinationUrl: (value: string) => void;
  adSetNames: string[];
  onSetAdSetNameAt: (index: number, name: string) => void;
  catalogBusinessId: string;
  catalogMetaCatalogId: string;
  catalogProductSetId: string;
  catalogCustomEvent: CatalogCustomEventChoice;
  catalogInstagramActorId: string;
  onSetCatalogBusinessId: (value: string) => void;
  onSetCatalogMetaCatalogId: (value: string) => void;
  onSetCatalogProductSetId: (value: string) => void;
  onSetCatalogCustomEvent: (value: CatalogCustomEventChoice) => void;
  onSetCatalogInstagramActorId: (value: string) => void;
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

function billingEventLabelPt(optimizationGoal: string, event: WizardAdSetBillingEvent): string {
  if (event === "IMPRESSIONS") return "Impressões";
  if (optimizationGoal === "LINK_CLICKS" && event === "LINK_CLICKS") return "Cliques no link";
  if (optimizationGoal === "THRUPLAY" && event === "THRUPLAY") return "ThruPlay";
  if (optimizationGoal === "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS" && event === "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS") {
    return "Visualizações 2s";
  }
  return event;
}

export function Step2Config(props: Step2ConfigProps) {
  const {
    creativeCount = 0,
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
    nomenclaturePreviewContext,
    pixelOptions,
    pixelsLoading = false,
    campaignSchedule,
    adSetBillingEvent,
    onSetAdSetBillingEvent,
    onSetCampaignSchedule,
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
    destinationUrl,
    onSetDestinationUrl,
    adSetNames,
    onSetAdSetNameAt,
    catalogBusinessId,
    catalogMetaCatalogId,
    catalogProductSetId,
    catalogCustomEvent,
    catalogInstagramActorId,
    onSetCatalogBusinessId,
    onSetCatalogMetaCatalogId,
    onSetCatalogProductSetId,
    onSetCatalogCustomEvent,
    onSetCatalogInstagramActorId,
    onPrev,
    onNext,
  } = props;

  useEffect(() => {
    onSetNomenclaturePreview(buildNomenclaturePreview(nomenclatureTokens, nomenclaturePreviewContext));
  }, [nomenclatureTokens, nomenclaturePreviewContext, onSetNomenclaturePreview]);

  const optimizationGoal = useMemo(
    () => selectOptimizationForObjective(objective, pixelId).optimization_goal,
    [objective, pixelId]
  );
  const billingOptions = useMemo(
    () => validBillingEventsForOptimizationGoal(optimizationGoal) as WizardAdSetBillingEvent[],
    [optimizationGoal]
  );
  const showAdSetBillingChoice = billingOptions.length > 1;
  const effectiveBillingSelection =
    adSetBillingEvent ?? defaultBillingEventForOptimizationGoal(optimizationGoal);

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
              title="DPA · Catálogo"
              description="Campanha com catálogo e produtos dinâmicos (template). Preenche os IDs abaixo e publica pela fila — usa a API de catálogo no servidor."
            />
          </div>
        </section>

        {campaignType === "DPA" ? (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Catálogo Meta (DPA)</h4>
            <p className="mt-1 text-xs text-emerald-900/80">
              Business ID, ID do catálogo e do product set vêm do Commerce Manager / Business Settings. O pixel deve ser o
              da mesma conta de anúncios.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-gray-700">
                Business ID
                <input
                  value={catalogBusinessId}
                  onChange={(e) => onSetCatalogBusinessId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="ex. 1234567890"
                />
              </label>
              <label className="block text-xs font-medium text-gray-700">
                ID catálogo (Meta)
                <input
                  value={catalogMetaCatalogId}
                  onChange={(e) => onSetCatalogMetaCatalogId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-gray-700">
                ID product set
                <input
                  value={catalogProductSetId}
                  onChange={(e) => onSetCatalogProductSetId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-gray-700">
                Evento de conversão
                <select
                  value={catalogCustomEvent}
                  onChange={(e) => onSetCatalogCustomEvent(e.target.value as CatalogCustomEventChoice)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="PURCHASE">Purchase</option>
                  <option value="ADD_TO_CART">AddToCart</option>
                  <option value="CONTENT_VIEW">ViewContent</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-gray-700 sm:col-span-2">
                Instagram actor ID (opcional, para placements Instagram)
                <input
                  value={catalogInstagramActorId}
                  onChange={(e) => onSetCatalogInstagramActorId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="ID da identidade Instagram da página"
                />
              </label>
            </div>
          </section>
        ) : null}

        <section className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[1fr_180px]">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Orçamento da campanha</h4>
            <CurrencyInputBrl
              id="wizard-campaign-budget"
              className="mt-2"
              value={budget}
              onValueChange={(v) => {
                if (v !== undefined) onSetBudget(v);
              }}
              min={6}
              inputClassName="border-gray-300 py-2 text-sm text-gray-900 focus:border-[#7132f5] focus:ring-[#7132f5]/25"
            />
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

        <Step2Schedule
          budgetPeriod={budgetPeriod}
          campaignSchedule={campaignSchedule}
          onSetCampaignSchedule={onSetCampaignSchedule}
        />

        <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">URL do site (Saiba mais)</h4>
            <p className="mt-1 text-xs text-gray-600">Endereço https para o botão «Saiba mais» no anúncio (Marketing API: link + CTA).</p>
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              value={destinationUrl}
              onChange={(e) => onSetDestinationUrl(e.target.value.slice(0, 2048))}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              placeholder="https://teusite.com/pagina"
            />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Nomes dos conjuntos no Meta</h4>
            <p className="mt-1 text-xs text-gray-600">
              Um rótulo por conjunto ({adSetNames.length} com a estrutura actual). Aparecem no Gestor de Anúncios.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {adSetNames.map((label, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-xs tabular-nums text-gray-500">{idx + 1}</span>
                  <input
                    type="text"
                    value={label}
                    maxLength={256}
                    onChange={(e) => onSetAdSetNameAt(idx, e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
                  />
                </div>
              ))}
            </div>
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
                {bidStrategy === "ROAS" ? (
                  <input
                    type="number"
                    value={roasTarget ?? ""}
                    onChange={(event) =>
                      onSetRoasTarget(event.target.value ? Number(event.target.value) : undefined)
                    }
                    className="mt-2 w-44 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
                  />
                ) : (
                  <CurrencyInputBrl
                    id="wizard-bid-limit"
                    className="mt-2 w-44"
                    value={bidLimit}
                    onValueChange={onSetBidLimit}
                    allowEmpty
                    inputClassName="border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-[#7132f5] focus:ring-[#7132f5]/25"
                  />
                )}
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
              onSetNomenclaturePreview(buildNomenclaturePreview(tokens, nomenclaturePreviewContext));
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
            {pixelsLoading ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#7132f5]" aria-hidden />
                <span>A carregar pixels…</span>
              </div>
            ) : (
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
            )}
          </div>
          {showAdSetBillingChoice ? (
            <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cobrança do conjunto</h4>
              <p className="mt-1 text-xs text-gray-500">
                O Meta permite mais de uma opção para este objetivo de optimização; escolhe como queres ser cobrado.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {billingOptions.map((ev) => (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => onSetAdSetBillingEvent(ev)}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      effectiveBillingSelection === ev
                        ? "border-[#7132f5] bg-[#7132f5] text-white"
                        : "border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    {billingEventLabelPt(optimizationGoal, ev)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
            {creativeCount > 1 ? (
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                Com vários criativos, para os publicar na mesma campanha Meta (um criativo por conjunto), escolhe
                estrutura personalizada 1-N-1 com N igual ao número de criativos (ex.: 2 criativos → 1 campanha, 2
                conjuntos, 1 anúncio por conjunto).
              </p>
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
