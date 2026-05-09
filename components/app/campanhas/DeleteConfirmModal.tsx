"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export function DeleteConfirmModal({
  open,
  count,
  onClose,
  onConfirm,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (open) setConfirmText("");
  }, [open]);

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
      {open ? (
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
            className="fixed left-1/2 top-1/2 z-[121] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-dashboard-border bg-dashboard-surface p-6 text-center shadow-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
          >
            <AlertTriangle className="mx-auto h-10 w-10 text-semantic-red" aria-hidden />
            <h3 className="mt-4 font-display text-lg font-bold text-neutral-black">
              Excluir {count} campanha{count > 1 ? "s" : ""}?
            </h3>
            <p className="mt-2 text-sm text-neutral-gray">
              Esta ação não pode ser desfeita. As campanhas serão removidas permanentemente.
            </p>
            <input
              type="text"
              placeholder='Digite "excluir" para confirmar'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-4 w-full rounded-lg border border-neutral-border bg-neutral-white px-3 py-2.5 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
              aria-label="Confirmação por texto"
            />
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" className="px-4 py-2.5 text-sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                className="px-4 py-2.5 text-sm"
                disabled={confirmText !== "excluir"}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                Excluir definitivamente
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
