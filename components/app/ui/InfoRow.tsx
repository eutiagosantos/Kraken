"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function InfoRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashboard-border py-3 text-sm last:border-0">
      <span className="shrink-0 text-neutral-gray">{label}</span>
      <div className="flex min-w-0 items-center gap-2 text-right font-medium text-neutral-black">
        <span className="truncate">{value}</span>
        {copyable ? (
          <>
            <AnimatePresence>
              {copied ? (
                <motion.span
                  key="copied-pill"
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex shrink-0 items-center rounded-full bg-semantic-green-bg px-2 py-0.5 text-[11px] font-medium text-semantic-green"
                  role="status"
                >
                  Copiado
                </motion.span>
              ) : null}
            </AnimatePresence>
            <button
              type="button"
              className={cn(
                "shrink-0 rounded p-1 transition-colors",
                copied
                  ? "text-semantic-green"
                  : "text-neutral-gray hover:bg-dashboard-sidebar-ghost hover:text-brand-purple"
              )}
              aria-label={copied ? "Copiado" : "Copiar"}
              aria-live="polite"
              onClick={async () => {
                await navigator.clipboard.writeText(value);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">{copied ? "Copiado" : "Copiar"}</span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
