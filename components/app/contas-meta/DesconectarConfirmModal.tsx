"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ModalPortal } from "@/components/app/ui/ModalPortal";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ContaMeta } from "@/lib/mock-contas";

const CONFIRM_WORD = "desconectar";

export function DesconectarConfirmModal({
  conta,
  open,
  onClose,
  onConfirm,
}: {
  conta: ContaMeta | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void | Promise<void>;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setConfirmError(null);
      setDisconnecting(false);
    }
  }, [open, conta]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const confirmed = confirmText.trim().toLowerCase() === CONFIRM_WORD;

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
            <div className="pointer-events-none fixed inset-0 z-[121] flex items-center justify-center p-4">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="desconectar-title"
                className="pointer-events-auto w-full max-w-md rounded-card border border-dashboard-border bg-dashboard-surface p-6 text-center shadow-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <AlertTriangle className="mx-auto h-10 w-10 text-semantic-red" aria-hidden />
                <h3 id="desconectar-title" className="mt-4 font-display text-lg font-bold text-neutral-black">
                  Desconectar &quot;{conta.name}&quot;?
                </h3>
                <p className="mt-2 text-sm text-neutral-gray">
                  Esta ação não pode ser desfeita. A conta será removida da plataforma; anúncios já publicados no Meta
                  Ads não são apagados, mas novos uploads não poderão usar esta conta. Campanhas em andamento podem ser
                  interrompidas.
                </p>
                <input
                  type="text"
                  placeholder={`Digite "${CONFIRM_WORD}" para confirmar`}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-4 w-full rounded-lg border border-neutral-border bg-neutral-white px-3 py-2.5 text-left text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
                  aria-label="Confirmação por texto"
                  autoComplete="off"
                />
                {confirmError ? (
                  <p className="mt-4 text-left text-sm font-medium text-semantic-red" role="alert">
                    {confirmError}
                  </p>
                ) : null}
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-4 py-2.5 text-sm"
                    disabled={disconnecting}
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="px-4 py-2.5 text-sm"
                    disabled={!confirmed || disconnecting}
                    onClick={() => {
                      void (async () => {
                        setConfirmError(null);
                        setDisconnecting(true);
                        try {
                          await Promise.resolve(onConfirm(conta.id));
                          onClose();
                        } catch (e) {
                          setConfirmError(e instanceof Error ? e.message : "Não foi possível desconectar.");
                        } finally {
                          setDisconnecting(false);
                        }
                      })();
                    }}
                  >
                    {disconnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                        A desconectar…
                      </>
                    ) : (
                      "Desconectar definitivamente"
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
