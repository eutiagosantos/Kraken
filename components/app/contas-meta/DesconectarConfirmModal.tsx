"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Unplug } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import type { ContaMeta } from "@/lib/mock-contas";

function WarningList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2 rounded-lg border border-dashboard-border bg-dashboard-base px-4 py-3 text-sm text-neutral-black">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span className="text-brand-purple">•</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function DesconectarConfirmModal({
  conta,
  open,
  onClose,
  onConfirm,
}: {
  conta: ContaMeta | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
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
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="desconectar-title"
            className="fixed left-1/2 top-1/2 z-[121] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-dashboard-border bg-dashboard-surface p-6 shadow-card"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-semantic-red-bg">
                <Unplug className="h-7 w-7 text-semantic-red" aria-hidden />
              </div>
              <h3 id="desconectar-title" className="font-display text-lg font-bold text-neutral-black">
                Desconectar &quot;{conta.name}&quot;?
              </h3>
              <p className="text-sm text-neutral-gray">
                A conta será removida da plataforma. Os anúncios já criados no Meta Ads não serão afetados, mas novos
                uploads não poderão usar esta conta.
              </p>
            </div>
            <WarningList
              items={[
                "Campanhas em andamento serão interrompidas",
                "Histórico de uploads será mantido",
                "Você pode reconectar a conta a qualquer momento",
              ]}
            />
            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-dashboard-border pt-5">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" variant="danger" onClick={() => onConfirm(conta.id)}>
                <Unplug className="h-4 w-4" aria-hidden />
                Desconectar Conta
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
