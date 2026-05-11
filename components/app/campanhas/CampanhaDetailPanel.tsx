"use client";

import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Pause, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import { InfoRow } from "@/components/app/ui/InfoRow";
import { PanelFooter } from "@/components/app/ui/PanelFooter";
import { cn } from "@/lib/utils";
import type { Campanha } from "@/lib/mock-campanhas";
import { StatusBadge } from "./StatusBadge";

function CreativeGrid({ creatives }: { creatives: Campanha["creatives"] }) {
  if (creatives.length === 0) {
    return <p className="text-sm text-neutral-gray">Nenhum criativo.</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {creatives.map((cr) => (
        <div key={cr.id} className="min-w-0">
          <div className="aspect-square overflow-hidden rounded-lg bg-dashboard-track">
            <img src={cr.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <p className="mt-1 truncate text-xs font-medium text-neutral-black">{cr.name}</p>
        </div>
      ))}
    </div>
  );
}

function ErrorItem({ err }: { err: NonNullable<Campanha["errors"]>[number] }) {
  return (
    <div className="flex gap-2 rounded-lg border border-semantic-red/20 bg-semantic-red-bg px-3 py-2 text-sm">
      <span className="font-semibold text-semantic-red">!</span>
      <div className="min-w-0">
        <p className="font-medium text-neutral-black">{err.message}</p>
        <p className="text-xs text-neutral-gray">Anúncio: {err.adName}</p>
      </div>
    </div>
  );
}

export function CampanhaDetailPanel({
  campanha,
  open,
  onClose,
  onExport,
  onDuplicate,
  onPause,
  onResume,
}: {
  campanha: Campanha | null;
  open: boolean;
  onClose: () => void;
  onExport: (c: Campanha) => void;
  onDuplicate: (c: Campanha) => void;
  onPause: (c: Campanha) => void;
  onResume: (c: Campanha) => void;
}) {
  const [layout, setLayout] = useState<"bottom" | "full" | "side">("side");

  useEffect(() => {
    const pick = () => {
      const w = window.innerWidth;
      if (w < 768) setLayout("bottom");
      else if (w < 1024) setLayout("full");
      else setLayout("side");
    };
    pick();
    window.addEventListener("resize", pick);
    return () => window.removeEventListener("resize", pick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && campanha ? (
        <>
          <motion.button
            type="button"
            aria-label="Fechar painel"
            className="fixed inset-0 z-[100] bg-[rgba(16,17,20,0.25)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="campanha-panel-title"
            className={cn(
              "fixed z-[101] flex flex-col overflow-y-auto bg-neutral-white shadow-[rgba(0,0,0,0.12)_-8px_0px_32px]",
              layout === "side" && "bottom-0 right-0 top-14 w-full max-w-[420px] border-l border-dashboard-border",
              layout === "full" && "bottom-0 right-0 top-14 w-full border-l border-dashboard-border",
              layout === "bottom" &&
                "bottom-0 left-0 right-0 h-[80vh] max-h-[80vh] rounded-t-2xl border-t border-dashboard-border"
            )}
            initial={
              layout === "bottom" ? { y: "100%", opacity: 0 } : { x: "100%", opacity: 0 }
            }
            animate={layout === "bottom" ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={layout === "bottom" ? { y: "100%", opacity: 0 } : { x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-dashboard-border bg-neutral-white px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 id="campanha-panel-title" className="truncate font-display text-lg font-bold text-neutral-black">
                  {campanha.name}
                </h2>
                <div className="mt-2">
                  <StatusBadge status={campanha.status} />
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-neutral-gray hover:bg-dashboard-sidebar-ghost"
                onClick={onClose}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 px-5 py-5">
              {campanha.status === "processando" ? (
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dashboard-muted">
                    Progresso em tempo real
                  </h3>
                  <ProgressBar current={campanha.adsCreated} total={campanha.adsTotal} showLabel />
                </section>
              ) : null}

              <section>
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-dashboard-muted">
                  Informações
                </h3>
                <InfoRow label="ID da Campanha" value={campanha.id} copyable />
                <InfoRow label="Conta Meta" value={campanha.account} />
                <InfoRow label="Estrutura" value={campanha.structure} />
                <InfoRow label="Objetivo" value={campanha.objective} />
                <InfoRow label="Orçamento Diário" value={`R$ ${campanha.dailyBudget.toFixed(2)}`} />
                <InfoRow label="Anti-Spy" value={campanha.antiSpy ? "Ativado" : "Desativado"} />
                <InfoRow
                  label="Criado em"
                  value={format(campanha.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                />
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dashboard-muted">
                  Criativos ({campanha.creatives.length})
                </h3>
                <CreativeGrid creatives={campanha.creatives} />
              </section>

              {campanha.status === "erro" && campanha.errors?.length ? (
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dashboard-muted">
                    Erros encontrados
                  </h3>
                  <div className="flex flex-col gap-2">
                    {campanha.errors.map((err) => (
                      <ErrorItem key={err.id} err={err} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <PanelFooter>
              <Button
                type="button"
                variant="outlined"
                className="min-w-[120px] flex-1 py-2.5 text-sm"
                onClick={() => onExport(campanha)}
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button
                type="button"
                variant="outlined"
                className="min-w-[120px] flex-1 py-2.5 text-sm"
                onClick={() => onDuplicate(campanha)}
              >
                Duplicar
              </Button>
              {campanha.status === "ativa" || campanha.status === "processando" ? (
                <Button
                  type="button"
                  variant="subtle"
                  className="min-w-[120px] flex-1 py-2.5 text-sm"
                  onClick={() => onPause(campanha)}
                >
                  <Pause className="h-4 w-4" />
                  Pausar
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="min-w-[120px] flex-1 py-2.5 text-sm"
                  onClick={() => onResume(campanha)}
                >
                  <Play className="h-4 w-4" />
                  Reativar
                </Button>
              )}
            </PanelFooter>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
