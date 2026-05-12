"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ModalPortal } from "@/components/app/ui/ModalPortal";
import { AlertTriangle, Loader2 } from "lucide-react";
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
  onConfirm: () => void | Promise<void>;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setConfirmError(null);
      setDeleting(false);
    }
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
    <ModalPortal>
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
          <div className="fixed inset-0 z-[121] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              className="pointer-events-auto w-full max-w-md rounded-card border border-dashboard-border bg-dashboard-surface p-6 text-center shadow-card"
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
            {confirmError ? (
              <p className="mt-4 text-sm font-medium text-semantic-red" role="alert">
                {confirmError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="px-4 py-2.5 text-sm"
                disabled={deleting}
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                className="px-4 py-2.5 text-sm"
                disabled={confirmText !== "excluir" || deleting}
                onClick={() => {
                  void (async () => {
                    setConfirmError(null);
                    setDeleting(true);
                    try {
                      await Promise.resolve(onConfirm());
                      onClose();
                    } catch (e) {
                      setConfirmError(e instanceof Error ? e.message : "Não foi possível excluir.");
                    } finally {
                      setDeleting(false);
                    }
                  })();
                }}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    A excluir…
                  </>
                ) : (
                  "Excluir definitivamente"
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
