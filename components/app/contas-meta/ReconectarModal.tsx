"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ModalPortal } from "@/components/app/ui/ModalPortal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ContaMeta } from "@/lib/mock-contas";

export function ReconectarModal({
  conta,
  open,
  onClose,
  onReconnected,
}: {
  conta: ContaMeta | null;
  open: boolean;
  onClose: () => void;
  onReconnected: () => void | Promise<void>;
}) {
  const [newToken, setNewToken] = useState("");
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (open) setNewToken("");
  }, [open, conta]);

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
              aria-labelledby="reconectar-title"
              className="pointer-events-auto w-full max-w-md rounded-card border border-dashboard-border bg-dashboard-surface p-6 shadow-card"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
            <h2 id="reconectar-title" className="font-display text-xl font-bold text-neutral-black">
              Reconectar conta
            </h2>
            <div className="mt-4 flex gap-3 rounded-lg border border-semantic-yellow/30 bg-semantic-yellow-bg px-3 py-3 text-sm text-neutral-black">
              <AlertTriangle className="h-5 w-5 shrink-0 text-semantic-yellow" aria-hidden />
              <p>
                O token desta conta expirou em {format(conta.tokenExpiresAt, "dd/MM/yyyy", { locale: ptBR })}. Reconecte para
                continuar criando anúncios.
              </p>
            </div>
            <div className="mt-4">
              <label htmlFor="recon-token" className="mb-1.5 block text-sm font-semibold text-neutral-black">
                Novo Token de Acesso
              </label>
              <input
                id="recon-token"
                type="password"
                placeholder="EAAxxxxxxxxxxxxxxxxx..."
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                className="w-full rounded-lg border border-neutral-border bg-neutral-white px-3 py-2.5 text-base outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
              />
            </div>
            <div className="mt-3 rounded-lg border border-dashboard-border bg-dashboard-base px-4 py-3 text-sm text-neutral-black">
              <p>
                Gere um novo token no{" "}
                <a
                  href="https://developers.facebook.com/tools/explorer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-purple underline"
                >
                  Meta Graph API Explorer
                </a>
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-dashboard-border pt-5">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!newToken.trim() || reconnecting}
                onClick={() => {
                  void (async () => {
                    setReconnecting(true);
                    try {
                      const res = await fetch("/api/contas-meta", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "sync_with_token", token: newToken.trim() }),
                      });
                      if (res.ok) {
                        await Promise.resolve(onReconnected());
                        onClose();
                      }
                    } finally {
                      setReconnecting(false);
                    }
                  })();
                }}
              >
                {reconnecting ? "Reconectando..." : "Reconectar"}
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
