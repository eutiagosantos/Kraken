"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CampanhaTabId } from "@/lib/mock-campanhas";

export function BulkActionsBar({
  selectedCount,
  allSelected,
  indeterminate,
  onToggleSelectAll,
  activeTab,
  onPause,
  onResume,
  onDuplicate,
  onExport,
  onDelete,
  showPause,
  showResume,
}: {
  selectedCount: number;
  allSelected: boolean;
  indeterminate: boolean;
  onToggleSelectAll: () => void;
  activeTab: CampanhaTabId;
  onPause: () => void;
  onResume: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
  showPause: boolean;
  showResume: boolean;
}) {
  const visible = selectedCount > 0;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="bulk"
          initial={{ opacity: 0, y: -12, scaleY: 0.95 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -12, scaleY: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "mb-3 flex flex-wrap items-center gap-3 rounded-[10px] border border-brand-purple bg-neutral-white px-4 py-2.5",
            "shadow-[0px_4px_20px_rgba(113,50,245,0.12)]"
          )}
        >
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-neutral-black">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-dashboard-border text-brand-purple focus:ring-brand-purple"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = indeterminate;
              }}
              onChange={onToggleSelectAll}
              aria-label="Selecionar todas nesta página"
            />
            {selectedCount} selecionada{selectedCount !== 1 ? "s" : ""}
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {activeTab === "ativas" && showPause ? (
              <Button type="button" variant="subtle" className="px-3 py-2 text-sm" onClick={onPause}>
                <Pause className="h-4 w-4" />
                Pausar
              </Button>
            ) : null}
            {activeTab === "ativas" && showResume ? (
              <Button type="button" variant="subtle" className="px-3 py-2 text-sm" onClick={onResume}>
                <Play className="h-4 w-4" />
                Reativar
              </Button>
            ) : null}
            <Button type="button" variant="subtle" className="px-3 py-2 text-sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
              Duplicar
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-2 text-sm" onClick={onExport}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button type="button" variant="danger" className="px-3 py-2 text-sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
