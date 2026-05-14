"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NomenclaturePreviewContext } from "@/lib/wizard/nomenclature-preview";
import { buildWizardPublishPayload } from "@/lib/wizard/build-wizard-publish-payload";
import { getWizardPublishSliceFromStore } from "@/lib/wizard/get-wizard-publish-slice";
import { getPublicoGeoValidationErrorPt } from "@/lib/wizard/publico-geo-validation";
import { adsetAndAdsCountsForWizardShape } from "@/lib/meta/map-wizard-to-graph";
import { mockWizardDataAdapter } from "@/lib/wizard/data-adapter";
import { isUploadJobInFlightStatus } from "@/lib/wizard/upload-jobs-in-flight";
import { useWizardStore, type Publico } from "@/lib/stores/wizardStore";
import { Step1Creatives } from "./wizard/Step1Creatives";
import { Step2Config } from "./wizard/Step2Config";
import { Step3Publico } from "./wizard/Step3Publico";
import { WizardStepIndicator } from "./wizard/WizardStepIndicator";

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
  const router = useRouter();
  const wizard = useWizardStore();
  const selectedAccountIds = useWizardStore((s) => s.selectedAccountIds);
  const selectedAccountIdsKey = selectedAccountIds.join(",");
  const [isNavigatingToQueue, startTransition] = useTransition();
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishNavigateError, setPublishNavigateError] = useState<string | null>(null);
  const [accountQuery, setAccountQuery] = useState("");
  const [publicoTab, setPublicoTab] = useState<"custom" | "salvos">("custom");
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof mockWizardDataAdapter.listAccounts>>>([]);
  const [pixelOptions, setPixelOptions] = useState<Awaited<ReturnType<typeof mockWizardDataAdapter.listPixels>>>([]);
  const [savedPublicos, setSavedPublicos] = useState<Publico[]>([]);
  const [wizardDataLoading, setWizardDataLoading] = useState(true);
  const [wizardDataError, setWizardDataError] = useState<string | null>(null);
  const [step1AdvanceError, setStep1AdvanceError] = useState<string | null>(null);
  const [step1AdvanceBusy, setStep1AdvanceBusy] = useState(false);

  useEffect(() => {
    async function loadData() {
      setWizardDataLoading(true);
      setWizardDataError(null);
      try {
        const accountIds = selectedAccountIds;
        const [nextAccounts, nextPixels, nextPublicos] = await Promise.all([
          mockWizardDataAdapter.listAccounts(),
          mockWizardDataAdapter.listPixels(accountIds.length > 0 ? accountIds : undefined),
          mockWizardDataAdapter.listSavedPublicos(),
        ]);
        setAccounts(nextAccounts);
        setPixelOptions(nextPixels);
        setSavedPublicos(nextPublicos);
      } catch (e) {
        setWizardDataError(
          e instanceof Error ? e.message : "Não foi possível carregar os dados do assistente."
        );
        setAccounts([]);
        setPixelOptions([]);
        setSavedPublicos([]);
      } finally {
        setWizardDataLoading(false);
      }
    }
    void loadData();
  }, [selectedAccountIdsKey]);

  useEffect(() => {
    setStep1AdvanceError(null);
  }, [selectedAccountIdsKey, wizard.pageId]);

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

  const estimatedCampaigns = useMemo(() => {
    const { adsets, adsPerAdset } = adsetAndAdsCountsForWizardShape(wizard.structure, wizard.customStructure);
    const fuse = wizard.creatives.length === adsets && adsPerAdset === 1;
    return fuse
      ? wizard.selectedAccountIds.length
      : wizard.selectedAccountIds.length * wizard.creatives.length;
  }, [
    wizard.structure,
    wizard.customStructure,
    wizard.creatives.length,
    wizard.selectedAccountIds.length,
  ]);

  const step3PublishBlockedReason = useMemo(() => {
    const parts: string[] = [];
    if (!wizard.pageId?.trim()) {
      parts.push("Escolhe uma Página Facebook no passo 1 (Criativos e contas).");
    }
    const geoErr = getPublicoGeoValidationErrorPt(wizard.publico);
    if (geoErr) {
      parts.push(geoErr);
    }
    const dest = wizard.destinationUrl.trim();
    if (!dest) {
      parts.push("Indica a URL https do site (Saiba mais) no passo 2.");
    } else {
      try {
        if (new URL(dest).protocol !== "https:") {
          parts.push("A URL do site deve começar por https:// (passo 2).");
        }
      } catch {
        parts.push("URL do site inválida. Corrige no passo 2.");
      }
    }
    return parts.length > 0 ? parts.join(" ") : null;
  }, [wizard.pageId, wizard.publico, wizard.destinationUrl]);

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
        primaryText: "",
      });
    });
  };

  const sendToPublishQueue = () => {
    setPublishNavigateError(null);
    try {
      buildWizardPublishPayload(getWizardPublishSliceFromStore());
    } catch (e) {
      setPublishNavigateError(e instanceof Error ? e.message : "Não foi possível preparar a publicação.");
      return;
    }

    void (async () => {
      setPublishBusy(true);
      try {
        const res = await fetch("/api/upload-jobs?limit=50", { credentials: "include" });
        const body = (await res.json()) as { data?: { jobs: { status: string }[] }; error?: string };
        if (!res.ok) {
          setPublishNavigateError(body.error ?? "Não foi possível verificar a fila de envios.");
          return;
        }
        const hasInFlight = (body.data?.jobs ?? []).some((j) => isUploadJobInFlightStatus(j.status));
        if (hasInFlight) {
          setPublishNavigateError(
            "Já existe um envio em curso. Abre a fila de processamento e aguarda que termine antes de publicar outro."
          );
          return;
        }
      } catch {
        setPublishNavigateError("Não foi possível verificar a fila de envios.");
        return;
      } finally {
        setPublishBusy(false);
      }

      wizard.requestPublishJob();
      startTransition(() => {
        router.push("/fila-de-processamento");
      });
    })();
  };

  const handleStep1Next = async () => {
    setStep1AdvanceError(null);
    const pageId = wizard.pageId?.trim();
    if (!pageId || wizard.selectedAccountIds.length === 0) {
      wizard.setStep(2);
      return;
    }
    setStep1AdvanceBusy(true);
    try {
      const res = await fetch("/api/contas-meta/link-facebook-page", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, metaAccountIds: wizard.selectedAccountIds }),
      });
      const raw = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(typeof raw.error === "string" ? raw.error : `Pedido falhou (${res.status})`);
      }
      wizard.setStep(2);
    } catch (e) {
      setStep1AdvanceError(e instanceof Error ? e.message : "Não foi possível guardar a página nas contas.");
    } finally {
      setStep1AdvanceBusy(false);
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
              accountsLoading={wizardDataLoading}
              accountsLoadError={wizardDataError}
              hasNoAccountsAfterLoad={!wizardDataLoading && !wizardDataError && accounts.length === 0}
              selectedAccountIds={wizard.selectedAccountIds}
              accountQuery={accountQuery}
              onAccountQueryChange={setAccountQuery}
              onToggleAccount={wizard.toggleAccount}
              onAddCreativeFiles={addCreativeFiles}
              onRemoveCreative={wizard.removeCreative}
              onUpdateCreative={wizard.updateCreative}
              onSelectAllAccounts={() => wizard.setSelectedAccountIds(accounts.map((account) => account.id))}
              onNext={handleStep1Next}
              advanceError={step1AdvanceError}
              advanceBusy={step1AdvanceBusy}
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
              creativeCount={wizard.creatives.length}
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
              pixelsLoading={wizardDataLoading}
              campaignSchedule={wizard.campaignSchedule}
              adSetBillingEvent={wizard.adSetBillingEvent}
              onSetAdSetBillingEvent={wizard.setAdSetBillingEvent}
              onSetCampaignSchedule={wizard.setCampaignSchedule}
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
              destinationUrl={wizard.destinationUrl}
              onSetDestinationUrl={wizard.setDestinationUrl}
              adSetNames={wizard.adSetNames}
              onSetAdSetNameAt={wizard.setAdSetNameAt}
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
              publishing={publishBusy || isNavigatingToQueue}
              publishBlockedReason={step3PublishBlockedReason}
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
              onPublish={sendToPublishQueue}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {publishNavigateError ? (
        <p className="border-t border-gray-200 bg-red-50 px-6 py-3 text-sm text-red-700">{publishNavigateError}</p>
      ) : null}
    </div>
  );
}
