"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Campanha } from "@/lib/mock-campanhas";

const fieldOptions = [
  "Nome e ID das campanhas",
  "Status e progresso",
  "Criativos utilizados",
  "Erros encontrados",
  "Métricas de performance",
] as const;

export function ExportModal({
  campanha,
  selectionCount,
  open,
  onClose,
  onExport,
}: {
  campanha: Campanha | null;
  /** When bulk export without a single row context */
  selectionCount?: number;
  open: boolean;
  onClose: () => void;
  onExport: (format: string, fields: string[]) => void;
}) {
  const [format, setFormat] = useState("CSV");
  const [fields, setFields] = useState<string[]>([...fieldOptions]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggleField = (f: string) => {
    setFields((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  return (
    <AnimatePresence>
      {open && (campanha || (selectionCount && selectionCount > 0)) ? (
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
            className="fixed left-1/2 top-1/2 z-[121] max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-dashboard-border bg-dashboard-surface p-6 shadow-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-bold text-neutral-black">Exportar relatório</h3>
            <p className="mt-1 text-sm text-neutral-gray">
              {campanha?.name ??
                (selectionCount ? `Exportando ${selectionCount} campanhas selecionadas` : "")}
            </p>

            <div className="mt-5">
              <p className="text-sm font-semibold text-neutral-black">Formato</p>
              <div className="mt-2 flex flex-col gap-2">
                {(["CSV", "Excel (.xlsx)", "PDF"] as const).map((f) => (
                  <label key={f} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="export-format"
                      checked={format === f}
                      onChange={() => setFormat(f)}
                      className="h-4 w-4 border-dashboard-border text-brand-purple focus:ring-brand-purple"
                    />
                    {f}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-neutral-black">Incluir no relatório</p>
              <div className="mt-2 flex flex-col gap-2">
                {fieldOptions.map((f) => (
                  <label key={f} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-gray">
                    <input
                      type="checkbox"
                      checked={fields.includes(f)}
                      onChange={() => toggleField(f)}
                      className="h-4 w-4 rounded border-dashboard-border text-brand-purple focus:ring-brand-purple"
                    />
                    {f}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" className="px-4 py-2.5 text-sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                className="px-4 py-2.5 text-sm"
                onClick={() => {
                  onExport(format, fields);
                  onClose();
                }}
              >
                <Download className="h-4 w-4" />
                Exportar relatório
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
