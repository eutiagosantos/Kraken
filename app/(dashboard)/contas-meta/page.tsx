"use client";

import { addDays } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  defaultContasFilters,
  filterAndSortContas,
  hasActiveContasFilters,
  type ContasPageFiltersState,
} from "@/lib/contas-meta-filters";
import {
  hasTokenExpiringSoonBanner,
  mockContas,
  tabCounts,
  type ContaMeta,
  type ContaTabId,
} from "@/lib/mock-contas";
import { ConectarContaModal } from "@/components/app/contas-meta/ConectarContaModal";
import { ContasGrid } from "@/components/app/contas-meta/ContasGrid";
import { ContasHeader } from "@/components/app/contas-meta/ContasHeader";
import { ContasMetaFilterBar } from "@/components/app/contas-meta/ContasMetaFilterBar";
import { ContaMetricsPanel } from "@/components/app/contas-meta/ContaMetricsPanel";
import { DesconectarConfirmModal } from "@/components/app/contas-meta/DesconectarConfirmModal";
import { EditarContaModal } from "@/components/app/contas-meta/EditarContaModal";
import { ReconectarModal } from "@/components/app/contas-meta/ReconectarModal";
import { StatusFilterTabs } from "@/components/app/contas-meta/StatusFilterTabs";
import { useSuccessFeedback } from "@/components/app/ui/SuccessFeedback";

type OpenModal = "conectar" | "editar" | "reconectar" | "desconectar" | null;

export default function ContasMetaPage() {
  const { showSuccess } = useSuccessFeedback();
  const [contas, setContas] = useState<ContaMeta[]>(() => mockContas);
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
        onConnect={(nova) => {
          setContas((prev) => [...prev, nova]);
          showSuccess("Conta conectada com sucesso.");
        }}
      />

      <EditarContaModal
        conta={openModal === "editar" ? modalConta : null}
        open={openModal === "editar"}
        onClose={() => setOpenModal(null)}
        onSave={(id, patch) => {
          setContas((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
          showSuccess("Alterações salvas com sucesso.");
        }}
      />

      <ReconectarModal
        conta={openModal === "reconectar" ? modalConta : null}
        open={openModal === "reconectar"}
        onClose={() => setOpenModal(null)}
        onReconnect={(id) => {
          setContas((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    status: "ativa",
                    tokenStatus: "valido",
                    tokenExpiresAt: addDays(new Date(), 60),
                    lastActivity: new Date(),
                  }
                : c
            )
          );
          showSuccess("Conta reconectada com sucesso.");
        }}
      />

      <DesconectarConfirmModal
        conta={openModal === "desconectar" ? modalConta : null}
        open={openModal === "desconectar"}
        onClose={() => setOpenModal(null)}
        onConfirm={(id) => {
          setContas((prev) => prev.filter((c) => c.id !== id));
          showSuccess("Conta desconectada com sucesso.");
        }}
      />
    </div>
  );
}
