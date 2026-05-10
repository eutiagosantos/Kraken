"use client";

import { AnimatePresence, motion } from "framer-motion";
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
  onReconnect,
}: {
  conta: ContaMeta | null;
  open: boolean;
  onClose: () => void;
  onReconnect: (id: string) => void;
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
            aria-labelledby="reconectar-title"
            className="fixed left-1/2 top-1/2 z-[121] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-dashboard-border bg-dashboard-surface p-6 shadow-card"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
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
                  setReconnecting(true);
                  setTimeout(() => {
                    setReconnecting(false);
                    onReconnect(conta.id);
                    onClose();
                  }, 800);
                }}
              >
                {reconnecting ? "Reconectando..." : "Reconectar"}
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
