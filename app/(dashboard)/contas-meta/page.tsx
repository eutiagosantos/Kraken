"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  defaultContasFilters,
  filterAndSortContas,
  hasActiveContasFilters,
  type ContasPageFiltersState,
} from "@/lib/contas-meta-filters";
import { hasTokenExpiringSoonBanner, tabCounts, type ContaMeta, type ContaTabId } from "@/lib/mock-contas";
import { ConectarContaModal } from "@/components/app/contas-meta/ConectarContaModal";
import { ContasGrid } from "@/components/app/contas-meta/ContasGrid";
import { ContasHeader } from "@/components/app/contas-meta/ContasHeader";
import { ContasMetaFilterBar } from "@/components/app/contas-meta/ContasMetaFilterBar";
import { ContaMetricsPanel } from "@/components/app/contas-meta/ContaMetricsPanel";
import { DesconectarConfirmModal } from "@/components/app/contas-meta/DesconectarConfirmModal";
import { EditarContaModal } from "@/components/app/contas-meta/EditarContaModal";
import { ReconectarModal } from "@/components/app/contas-meta/ReconectarModal";
import { StatusFilterTabs } from "@/components/app/contas-meta/StatusFilterTabs";
import { Button } from "@/components/ui/Button";
import { useSuccessFeedback } from "@/components/app/ui/SuccessFeedback";
import { useContasMeta } from "@/lib/hooks/useContasMeta";

type OpenModal = "conectar" | "editar" | "reconectar" | "desconectar" | null;

export default function ContasMetaPage() {
  const { showSuccess } = useSuccessFeedback();
  const { contas, loading, error, refetch } = useContasMeta();
  const [activeTab, setActiveTab] = useState<ContaTabId>("todas");
  const [filters, setFilters] = useState<ContasPageFiltersState>(() => defaultContasFilters());
  const [selectedConta, setSelectedConta] = useState<ContaMeta | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [modalConta, setModalConta] = useState<ContaMeta | null>(null);

  const counts = useMemo(() => tabCounts(contas), [contas]);
  const filtered = useMemo(
    () => filterAndSortContas(contas, activeTab, filters),
    [contas, activeTab, filters]
  );
  const showTokenBanner = useMemo(() => hasTokenExpiringSoonBanner(contas), [contas]);

  const openMetrics = (c: ContaMeta) => {
    setSelectedConta(c);
    setPanelOpen(true);
  };

  const openModalFor = (kind: Exclude<OpenModal, null>, c: ContaMeta | null) => {
    setModalConta(c);
    setOpenModal(kind);
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      {showTokenBanner ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-semantic-yellow/30 bg-semantic-yellow-bg px-4 py-3 text-sm text-neutral-black">
          <AlertTriangle className="h-5 w-5 shrink-0 text-semantic-yellow" aria-hidden />
          <p>
            <span className="font-semibold">Atenção:</span> pelo menos uma conta tem token expirando em breve (menos de
            7 dias). Renove o token para evitar interrupções.
          </p>
        </div>
      ) : null}

      <ContasHeader
        total={counts.todas}
        ativas={counts.ativas}
        comProblema={counts.problema}
        desconectadas={counts.desconectadas}
        onConnect={() => openModalFor("conectar", null)}
      />

      {loading && contas.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 py-16 text-sm text-neutral-silver">
          <Loader2 className="h-10 w-10 shrink-0 animate-spin text-brand-purple" aria-hidden />
          <p>A carregar contas Meta…</p>
        </div>
      ) : !loading && error ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashboard-border bg-white px-6 py-16 text-center">
          <p className="max-w-md text-sm text-semantic-red">{error}</p>
          <Button type="button" variant="subtle" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <ContasMetaFilterBar
            filters={filters}
            onChange={(next) => setFilters((f) => ({ ...f, ...next }))}
            onClear={() => setFilters(defaultContasFilters())}
            hasActiveFilters={hasActiveContasFilters(filters)}
          />

          <StatusFilterTabs activeTab={activeTab} onChange={setActiveTab} counts={counts}>
            <ContasGrid
              contas={filtered}
              onOpenMetrics={openMetrics}
              onEdit={(c) => openModalFor("editar", c)}
              onReconnect={(c) => openModalFor("reconectar", c)}
              onDisconnect={(c) => openModalFor("desconectar", c)}
              onConnectNew={() => openModalFor("conectar", null)}
            />
          </StatusFilterTabs>
        </>
      )}

      <ContaMetricsPanel
        conta={selectedConta}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onEdit={(c) => {
          setPanelOpen(false);
          openModalFor("editar", c);
        }}
        onReconnect={(c) => {
          setPanelOpen(false);
          openModalFor("reconectar", c);
        }}
      />

      <ConectarContaModal
        open={openModal === "conectar"}
        onClose={() => setOpenModal(null)}
        onConnected={() => {
          void refetch();
          showSuccess("Conta sincronizada com sucesso.");
        }}
      />

      <EditarContaModal
        conta={openModal === "editar" ? modalConta : null}
        open={openModal === "editar"}
        onClose={() => setOpenModal(null)}
        onSave={async (id, patch) => {
          const res = await fetch(`/api/contas-meta/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nickname: patch.nickname,
              defaultBudget: patch.defaultBudget,
              defaultStructure: patch.defaultStructure,
              defaultAntiSpy: patch.defaultAntiSpy,
            }),
          });
          if (res.ok) {
            await refetch();
            showSuccess("Alterações salvas com sucesso.");
          }
        }}
      />

      <ReconectarModal
        conta={openModal === "reconectar" ? modalConta : null}
        open={openModal === "reconectar"}
        onClose={() => setOpenModal(null)}
        onReconnected={() => {
          void refetch();
          showSuccess("Conta reconectada com sucesso.");
        }}
      />

      <DesconectarConfirmModal
        conta={openModal === "desconectar" ? modalConta : null}
        open={openModal === "desconectar"}
        onClose={() => setOpenModal(null)}
        onConfirm={async (id) => {
          const res = await fetch(`/api/contas-meta/${id}`, { method: "DELETE", credentials: "include" });
          if (res.ok) {
            await refetch();
            showSuccess("Conta desconectada com sucesso.");
          }
        }}
      />
    </div>
  );
}
