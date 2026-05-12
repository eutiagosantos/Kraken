"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ModalPortal } from "@/components/app/ui/ModalPortal";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ContaMeta } from "@/lib/mock-contas";

const structures = ["1-50-1", "1-3-5", "1-1-5", "Nenhuma"] as const;

const notifOptions = [
  "Alertar quando token estiver próximo de expirar",
  "Alertar quando houver anúncios rejeitados",
  "Resumo diário de gastos por e-mail",
] as const;

export function EditarContaModal({
  conta,
  open,
  onClose,
  onSave,
}: {
  conta: ContaMeta | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Pick<ContaMeta, "nickname" | "defaultBudget" | "defaultStructure" | "defaultAntiSpy">>) => void | Promise<void>;
}) {
  const [nickname, setNickname] = useState("");
  const [defaultBudget, setDefaultBudget] = useState("");
  const [defaultStructure, setDefaultStructure] = useState<string>("1-50-1");
  const [defaultAntiSpy, setDefaultAntiSpy] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    [notifOptions[0]]: true,
    [notifOptions[1]]: true,
    [notifOptions[2]]: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (conta && open) {
      setNickname(conta.nickname ?? "");
      setDefaultBudget(String(conta.defaultBudget));
      setDefaultStructure(conta.defaultStructure);
      setDefaultAntiSpy(conta.defaultAntiSpy);
      setSaveError(null);
      setSubmitting(false);
    }
  }, [conta, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggleNotif = (key: string) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ModalPortal>
    <AnimatePresence>
      {open && conta ? (
        <>
          <motion.div
            className="fixed inset-0 z-[120] bg-[rgba(16,17,20,0.35)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          {/* Wrapper sem transform: Framer Motion no card sobrescreve translate do Tailwind e cortava o rodapé */}
          <div
            className="pointer-events-none fixed inset-0 z-[121] flex items-center justify-center p-4"
            role="presentation"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-conta-title"
              className="pointer-events-auto flex min-h-0 w-full max-w-md max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-card border border-dashboard-border bg-dashboard-surface shadow-card"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="shrink-0 border-b border-dashboard-border px-6 pb-4 pt-6">
              <h2 id="edit-conta-title" className="font-display text-xl font-bold text-neutral-black">
                Editar conta
              </h2>
              <p className="mt-1 text-sm text-neutral-gray">{conta.name}</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="space-y-4">
              <Input
                id="edit-nickname"
                label="Apelido da conta"
                placeholder={conta.nickname ? undefined : `Opcional — padrão: ${conta.name}`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <div>
                <label htmlFor="edit-budget-conta" className="mb-1.5 block text-sm font-semibold text-neutral-black">
                  Orçamento padrão (R$)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-gray">
                    R$
                  </span>
                  <input
                    id="edit-budget-conta"
                    type="text"
                    inputMode="decimal"
                    value={defaultBudget}
                    onChange={(e) => setDefaultBudget(e.target.value.replace(/[^\d.,]/g, ""))}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-white py-2.5 pl-10 pr-3 text-base outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-gray">Pré-preenchido ao iniciar um novo upload com esta conta</p>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-neutral-black">Estrutura padrão</span>
                <select
                  value={defaultStructure}
                  onChange={(e) => setDefaultStructure(e.target.value)}
                  className="rounded-lg border border-neutral-border bg-neutral-white px-3 py-2.5 text-base outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
                >
                  {structures.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-dashboard-border bg-dashboard-base px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-black">Anti-Spy padrão</p>
                  <p className="text-xs text-neutral-gray">Ativado automaticamente em novos uploads</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={defaultAntiSpy}
                  onClick={() => setDefaultAntiSpy((v) => !v)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${defaultAntiSpy ? "bg-brand-purple" : "bg-dashboard-border-strong"}`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${defaultAntiSpy ? "left-5" : "left-0.5"}`}
                  />
                </button>
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-neutral-black">Notificações</legend>
                <div className="mt-2 space-y-2">
                  {notifOptions.map((opt) => (
                    <label key={opt} className="flex cursor-pointer items-start gap-2 text-sm text-neutral-black">
                      <input
                        type="checkbox"
                        checked={!!notifications[opt]}
                        onChange={() => toggleNotif(opt)}
                        className="mt-0.5 h-4 w-4 rounded border-dashboard-border text-brand-purple focus:ring-brand-purple"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            </div>

            {saveError ? (
              <p className="shrink-0 border-t border-dashboard-border bg-dashboard-surface px-6 pb-0 pt-3 text-sm font-medium text-semantic-red" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-dashboard-border bg-dashboard-surface px-6 py-4">
              <Button type="button" variant="ghost" disabled={submitting} onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={submitting}
                onClick={() => {
                  void (async () => {
                    const budget = Number(defaultBudget.replace(/\./g, "").replace(",", ".")) || 0;
                    setSaveError(null);
                    setSubmitting(true);
                    try {
                      await Promise.resolve(
                        onSave(conta.id, {
                          nickname: nickname.trim() || undefined,
                          defaultBudget: budget,
                          defaultStructure,
                          defaultAntiSpy,
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
                  "Salvar Alterações"
                )}
              </Button>
            </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
    </ModalPortal>
  );
}
