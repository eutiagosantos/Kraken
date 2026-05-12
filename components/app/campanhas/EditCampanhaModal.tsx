"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ModalPortal } from "@/components/app/ui/ModalPortal";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Campanha } from "@/lib/mock-campanhas";

const objectives = ["Conversões", "Tráfego", "Vendas", "Leads", "Engajamento", "Instalações", "Visualizações"];

export function EditCampanhaModal({
  campanha,
  open,
  onClose,
  onSave,
}: {
  campanha: Campanha | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Pick<Campanha, "name" | "dailyBudget" | "objective" | "antiSpy">>) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [objective, setObjective] = useState("");
  const [antiSpy, setAntiSpy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (campanha && open) {
      setName(campanha.name);
      setBudget(String(campanha.dailyBudget));
      setObjective(campanha.objective);
      setAntiSpy(campanha.antiSpy);
      setSaveError(null);
      setSubmitting(false);
    }
  }, [campanha, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <ModalPortal>
    <AnimatePresence>
      {open && campanha ? (
        <>
          <motion.div
            className="fixed inset-0 z-[120] bg-[rgba(16,17,20,0.35)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-campanha-title"
            className="fixed left-1/2 top-1/2 z-[121] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-dashboard-border bg-dashboard-surface p-6 shadow-card"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-campanha-title" className="font-display text-xl font-bold text-neutral-black">
              Editar campanha
            </h2>
            <div className="mt-5 space-y-4">
              <Input id="edit-name" label="Nome da Campanha" value={name} onChange={(e) => setName(e.target.value)} />
              <div>
                <label htmlFor="edit-budget" className="mb-1.5 block text-sm font-semibold text-neutral-black">
                  Orçamento Diário
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-gray">
                    R$
                  </span>
                  <input
                    id="edit-budget"
                    type="text"
                    inputMode="decimal"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value.replace(/[^\d.,]/g, ""))}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-white py-2.5 pl-10 pr-3 text-base text-neutral-black outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
                  />
                </div>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-neutral-black">Objetivo</span>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="rounded-lg border border-neutral-border bg-neutral-white px-3 py-2.5 text-base outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
                >
                  {objectives.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-neutral-black">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-dashboard-border text-brand-purple focus:ring-brand-purple"
                  checked={antiSpy}
                  onChange={(e) => setAntiSpy(e.target.checked)}
                />
                Anti-Spy
              </label>
            </div>
            {saveError ? (
              <p className="mt-4 text-sm font-medium text-semantic-red" role="alert">
                {saveError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="px-4 py-2.5 text-sm"
                disabled={submitting}
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                className="px-4 py-2.5 text-sm"
                disabled={submitting}
                onClick={() => {
                  void (async () => {
                    const n = parseFloat(budget.replace(",", "."));
                    setSaveError(null);
                    setSubmitting(true);
                    try {
                      await Promise.resolve(
                        onSave(campanha.id, {
                          name: name.trim() || campanha.name,
                          dailyBudget: Number.isFinite(n) ? n : campanha.dailyBudget,
                          objective,
                          antiSpy,
                        })
                      );
                      onClose();
                    } catch (e) {
                      setSaveError(e instanceof Error ? e.message : "Não foi possível salvar.");
                    } finally {
                      setSubmitting(false);
                    }
                  })();
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    A guardar…
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
    </ModalPortal>
  );
}
