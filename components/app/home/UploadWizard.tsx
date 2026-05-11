"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { WizardPublishPayload } from "@/lib/meta/map-wizard-to-graph";
import type { NomenclaturePreviewContext } from "@/lib/wizard/nomenclature-preview";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import { mockWizardDataAdapter } from "@/lib/wizard/data-adapter";
import { useWizardStore, type Publico, type Structure } from "@/lib/stores/wizardStore";
import { Step1Creatives } from "./wizard/Step1Creatives";
import { Step2Config } from "./wizard/Step2Config";
import { Step3Publico } from "./wizard/Step3Publico";
import { WizardStepIndicator } from "./wizard/WizardStepIndicator";

const adsetsByStructure: Record<Exclude<Structure, "custom">, number> = {
  "1-1-1": 1,
  "1-3-5": 3,
  "1-50-1": 50,
};

const lightSelectStyles = {
  control: (base: object) => ({ ...base, background: "#ffffff", borderColor: "#d1d5db", color: "#111827" }),
  menu: (base: object) => ({ ...base, background: "#ffffff", border: "1px solid #d1d5db" }),
  option: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    background: state.isFocused ? "rgba(113,50,245,0.1)" : "transparent",
    color: "#111827",
  }),
  multiValue: (base: object) => ({ ...base, background: "rgba(113,50,245,0.15)" }),
  multiValueLabel: (base: object) => ({ ...base, color: "#5b21b6" }),
  input: (base: object) => ({ ...base, color: "#111827" }),
  singleValue: (base: object) => ({ ...base, color: "#111827" }),
};

export function UploadWizard() {
  const wizard = useWizardStore();
  const [accountQuery, setAccountQuery] = useState("");
  const [publicoTab, setPublicoTab] = useState<"custom" | "salvos">("custom");
  const [publishing, setPublishing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof mockWizardDataAdapter.listAccounts>>>([]);
  const [pixelOptions, setPixelOptions] = useState<Awaited<ReturnType<typeof mockWizardDataAdapter.listPixels>>>([]);
  const [savedPublicos, setSavedPublicos] = useState<Publico[]>([]);

  useEffect(() => {
    async function loadData() {
      const [nextAccounts, nextPixels, nextPublicos] = await Promise.all([
        mockWizardDataAdapter.listAccounts(),
        mockWizardDataAdapter.listPixels(),
        mockWizardDataAdapter.listSavedPublicos(),
      ]);
      setAccounts(nextAccounts);
      setPixelOptions(nextPixels);
      setSavedPublicos(nextPublicos);
    }
    void loadData();
  }, []);

  const filteredAccounts = useMemo(() => {
    const query = accountQuery.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter(
      (account) => account.name.toLowerCase().includes(query) || account.id.toLowerCase().includes(query)
    );
  }, [accountQuery, accounts]);

  const nomenclaturePreviewContext = useMemo((): NomenclaturePreviewContext => {
    const selectedOrdered = accounts.filter((a) => wizard.selectedAccountIds.includes(a.id));
    const first = selectedOrdered[0];
    const pixelRow = pixelOptions.find((p) => p.id === wizard.pixelId);
    const estrutura =
      wizard.structure === "custom"
        ? `${wizard.customStructure.campaigns}-${wizard.customStructure.adsets}-${wizard.customStructure.ads}`
        : wizard.structure;

    let criativo = "—";
    if (wizard.creatives.length > 0) {
      const c0 = wizard.creatives[0].name;
      criativo = wizard.creatives.length === 1 ? c0 : `${c0} +${wizard.creatives.length - 1}`;
    }

    const pixel =
      wizard.pixelId.trim() === ""
        ? "—"
        : pixelRow
          ? `${wizard.pixelId} ${pixelRow.name}`
          : wizard.pixelId;

    return {
      contaNome: first?.name ?? "—",
      contaApelido: first?.nickname?.trim() || first?.name || "—",
      contaId: first?.id ?? "—",
      budget: String(wizard.budget),
      estrutura,
      pixel,
      objetivo: wizard.objective || "—",
      criativo,
      catalogo: "—",
      idFila: "—",
      seq: "01",
    };
  }, [
    accounts,
    pixelOptions,
    wizard.selectedAccountIds,
    wizard.creatives,
    wizard.budget,
    wizard.objective,
    wizard.pixelId,
    wizard.structure,
    wizard.customStructure.campaigns,
    wizard.customStructure.adsets,
    wizard.customStructure.ads,
  ]);

  const adsetsPerStructure =
    wizard.structure === "custom" ? wizard.customStructure.adsets : adsetsByStructure[wizard.structure];
  const estimatedCampaigns = wizard.selectedAccountIds.length * wizard.creatives.length * adsetsPerStructure;

  const addCreativeFiles = (files: File[]) => {
    files.forEach((file) => {
      const type = file.type.startsWith("video") ? "video" : "image";
      wizard.addCreative({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        type,
        preview: URL.createObjectURL(file),
        size: file.size,
      });
    });
  };

  const startPublish = async () => {
    setPublishError(null);
    setPublishing(true);
    setPublishOpen(true);
    setPublishProgress(4);
    const timer = setInterval(() => {
      setPublishProgress((progress) => (progress < 90 ? progress + 5 + Math.random() * 6 : progress));
    }, 220);
    try {
      const snapshot: WizardPublishPayload = {
        selectedAccountIds: wizard.selectedAccountIds,
        creatives: wizard.creatives.map((c) => ({ id: c.id, name: c.name, type: c.type })),
        campaignType: wizard.campaignType,
        budget: wizard.budget,
        budgetPeriod: wizard.budgetPeriod,
        bidStrategy: wizard.bidStrategy,
        ...(wizard.bidLimit !== undefined ? { bidLimit: wizard.bidLimit } : {}),
        ...(wizard.roasTarget !== undefined ? { roasTarget: wizard.roasTarget } : {}),
        objective: wizard.objective,
        pixelId: wizard.pixelId,
        status: wizard.status,
        structure: wizard.structure,
        customStructure: { ...wizard.customStructure },
        nomenclaturePreview: wizard.nomenclaturePreview.trim() || "Campanha Kraken",
        publico: { ...wizard.publico },
        antiSpy: true,
        ...(typeof process !== "undefined" && process.env.NEXT_PUBLIC_META_PAGE_ID
          ? { pageId: process.env.NEXT_PUBLIC_META_PAGE_ID }
          : {}),
      };
      await mockWizardDataAdapter.publishCampaigns({
        snapshot,
        creativeFiles: wizard.creatives.map((c) => c.file),
      });
      clearInterval(timer);
      setPublishProgress(100);
      setTimeout(() => {
        setPublishOpen(false);
        setPublishing(false);
        wizard.reset();
      }, 750);
    } catch (e) {
      clearInterval(timer);
      setPublishError(e instanceof Error ? e.message : "Falha na publicação.");
      setPublishProgress(0);
      setPublishing(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <WizardStepIndicator currentStep={wizard.step} />
      <AnimatePresence mode="wait">
        {wizard.step === 1 ? (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <Step1Creatives
              creatives={wizard.creatives}
              accounts={filteredAccounts}
              selectedAccountIds={wizard.selectedAccountIds}
              accountQuery={accountQuery}
              onAccountQueryChange={setAccountQuery}
              onToggleAccount={wizard.toggleAccount}
              onAddCreativeFiles={addCreativeFiles}
              onRemoveCreative={wizard.removeCreative}
              onSelectAllAccounts={() => wizard.setSelectedAccountIds(accounts.map((account) => account.id))}
              onNext={() => wizard.setStep(2)}
            />
          </motion.div>
        ) : null}

        {wizard.step === 2 ? (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <Step2Config
              campaignType={wizard.campaignType}
              budget={wizard.budget}
              budgetPeriod={wizard.budgetPeriod}
              bidStrategy={wizard.bidStrategy}
              bidLimit={wizard.bidLimit}
              roasTarget={wizard.roasTarget}
              objective={wizard.objective}
              pixelId={wizard.pixelId}
              status={wizard.status}
              structure={wizard.structure}
              customStructure={wizard.customStructure}
              nomenclatureTokens={wizard.nomenclatureTokens}
              nomenclaturePreview={wizard.nomenclaturePreview}
              nomenclaturePreviewContext={nomenclaturePreviewContext}
              pixelOptions={pixelOptions}
              onSetCampaignType={wizard.setCampaignType}
              onSetBudget={wizard.setBudget}
              onSetBudgetPeriod={wizard.setBudgetPeriod}
              onSetBidStrategy={wizard.setBidStrategy}
              onSetBidLimit={wizard.setBidLimit}
              onSetRoasTarget={wizard.setRoasTarget}
              onSetObjective={wizard.setObjective}
              onSetPixelId={wizard.setPixelId}
              onSetStatus={wizard.setStatus}
              onSetStructure={wizard.setStructure}
              onSetCustomStructure={wizard.setCustomStructure}
              onSetNomenclatureTokens={wizard.setNomenclatureTokens}
              onSetNomenclaturePreview={wizard.setNomenclaturePreview}
              onPrev={() => wizard.setStep(1)}
              onNext={() => wizard.setStep(3)}
            />
          </motion.div>
        ) : null}

        {wizard.step === 3 ? (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <Step3Publico
              publico={wizard.publico}
              publicoTab={publicoTab}
              savedPublicos={savedPublicos}
              selectedAccountCount={wizard.selectedAccountIds.length}
              creativeCount={wizard.creatives.length}
              campaignType={wizard.campaignType}
              objective={wizard.objective}
              bidStrategy={wizard.bidStrategy}
              structure={wizard.structure}
              status={wizard.status}
              budget={wizard.budget}
              estimatedCampaigns={estimatedCampaigns}
              publishing={publishing}
              darkSelectStyles={lightSelectStyles}
              onSetPublicoTab={setPublicoTab}
              onSetPublico={wizard.setPublico}
              onLoadPublico={(publico) => wizard.setPublico(publico)}
              onDeletePublico={(id) => setSavedPublicos((current) => current.filter((publico) => publico.id !== id))}
              onSavePublico={async () => {
                const saved = await mockWizardDataAdapter.savePublico(wizard.publico);
                setSavedPublicos((current) => [{ ...saved, id: `${saved.id}-${Date.now()}` }, ...current]);
              }}
              onPrev={() => wizard.setStep(2)}
              onPublish={() => void startPublish()}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {publishOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-xl border border-[#1e2130] bg-[#141720] p-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <p className="text-lg font-semibold text-white">
                {publishError ? "Erro na publicação" : "Publicando campanhas"}
              </p>
              {publishError ? (
                <p className="mt-2 text-sm text-red-400">{publishError}</p>
              ) : (
                <p className="mt-1 text-sm text-[#686b82]">
                  {publishProgress < 100 ? "Processando no Meta Ads..." : "Concluído!"}
                </p>
              )}
              <div className="mt-4">
                <ProgressBar value={publishError ? 0 : publishProgress} />
                {!publishError ? (
                  <p className="mt-2 text-right text-xs font-semibold text-[#9b72ff]">{Math.round(publishProgress)}%</p>
                ) : null}
              </div>
              {publishError ? (
                <button
                  type="button"
                  className="mt-4 w-full rounded-lg bg-[#2a2d3d] py-2 text-sm font-semibold text-white hover:bg-[#34384a]"
                  onClick={() => {
                    setPublishOpen(false);
                    setPublishError(null);
                  }}
                >
                  Fechar
                </button>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
