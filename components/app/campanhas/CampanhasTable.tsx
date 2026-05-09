"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Campanha, CampanhaTabId } from "@/lib/mock-campanhas";
import { CampanhaRow } from "./CampanhaRow";
import { CampanhasPagination } from "./CampanhasPagination";
import { CampanhaActionsMenu } from "./CampanhaActionsMenu";
import { MiniProgressBar } from "./MiniProgressBar";
import { StatusBadge } from "./StatusBadge";

export type SortKey = "name" | "account" | "ads_count" | "created_at";

export type SortConfig = { column: SortKey; direction: "asc" | "desc" };

const tabLabels: Record<CampanhaTabId, string> = {
  ativas: "ativas",
  concluidas: "concluídas",
  erro: "com erro",
};

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) {
    return (
      <span className="inline-flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
        <ChevronUp className="-mb-1.5 h-3 w-3 text-dashboard-muted" />
        <ChevronDown className="h-3 w-3 text-dashboard-muted" />
      </span>
    );
  }
  return dir === "asc" ? (
    <ChevronUp className="h-3.5 w-3.5 text-brand-purple" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 text-brand-purple" />
  );
}

export function CampanhasTable({
  rows,
  activeTab,
  selectedIds,
  onToggleSelect,
  onToggleSelectAllPage,
  allSelectedOnPage,
  indeterminateOnPage,
  sortConfig,
  onSort,
  onRowClick,
  onViewDetails,
  onToggleStatus,
  onDuplicate,
  onEdit,
  onExport,
  onDelete,
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPerPageChange,
}: {
  rows: Campanha[];
  activeTab: CampanhaTabId;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAllPage: () => void;
  allSelectedOnPage: boolean;
  indeterminateOnPage: boolean;
  sortConfig: SortConfig;
  onSort: (column: SortKey) => void;
  onRowClick: (c: Campanha) => void;
  onViewDetails: (c: Campanha) => void;
  onToggleStatus: (c: Campanha) => void;
  onDuplicate: (c: Campanha) => void;
  onEdit: (c: Campanha) => void;
  onExport: (c: Campanha) => void;
  onDelete: (c: Campanha) => void;
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
}) {
  const router = useRouter();

  const th = (column: SortKey, label: string, className?: string) => {
    const active = sortConfig.column === column;
    return (
      <th className={cn("px-4 py-2.5 text-left", className)}>
        <button
          type="button"
          onClick={() => onSort(column)}
          className="group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-dashboard-muted hover:text-neutral-black"
        >
          {label}
          <SortIcon active={active} dir={sortConfig.direction} />
        </button>
      </th>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashboard-border bg-dashboard-surface py-16 text-center shadow-subtle">
        <Layers className="h-12 w-12 text-dashboard-muted" aria-hidden />
        <h3 className="mt-4 font-display text-lg font-bold text-neutral-black">
          Nenhuma campanha {tabLabels[activeTab]}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-neutral-gray">
          {activeTab === "erro"
            ? "Ótimo! Nenhum erro encontrado."
            : "Faça seu primeiro upload para começar."}
        </p>
        {activeTab !== "erro" ? (
          <Button type="button" variant="primary" className="mt-6" onClick={() => router.push("/home")}>
            Novo Upload
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr>
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-dashboard-border text-brand-purple focus:ring-brand-purple"
                  checked={allSelectedOnPage}
                  ref={(el) => {
                    if (el) el.indeterminate = indeterminateOnPage;
                  }}
                  onChange={onToggleSelectAllPage}
                  aria-label="Selecionar todas nesta página"
                />
              </th>
              {th("name", "Campanha")}
              {th("account", "Conta Meta")}
              <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-muted lg:table-cell">
                Estrutura
              </th>
              {th("ads_count", "Anúncios")}
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Status
              </th>
              {th("created_at", "Criado em", "hidden lg:table-cell")}
              <th className="w-12 px-2 py-2.5" aria-label="Ações" />
            </tr>
          </thead>
          <motion.tbody
            className="table-row-group"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.04, delayChildren: 0 } },
            }}
            initial="hidden"
            animate="visible"
          >
            {rows.map((c, i) => (
              <CampanhaRow
                key={c.id}
                campanha={c}
                rowIndex={i}
                selected={selectedIds.includes(c.id)}
                onToggleSelect={() => onToggleSelect(c.id)}
                onRowClick={() => onRowClick(c)}
                onViewDetails={() => onViewDetails(c)}
                onToggleStatus={() => onToggleStatus(c)}
                onDuplicate={() => onDuplicate(c)}
                onEdit={() => onEdit(c)}
                onExport={() => onExport(c)}
                onDelete={() => onDelete(c)}
              />
            ))}
          </motion.tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        <label className="flex items-center gap-2 rounded-lg border border-dashboard-border bg-dashboard-surface px-3 py-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-dashboard-border text-brand-purple"
            checked={allSelectedOnPage}
            ref={(el) => {
              if (el) el.indeterminate = indeterminateOnPage;
            }}
            onChange={onToggleSelectAllPage}
          />
          Selecionar todas nesta página
        </label>
        {rows.map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => onRowClick(c)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(c);
              }
            }}
            className={cn(
              "flex w-full flex-col gap-3 rounded-card border border-dashboard-border bg-dashboard-surface p-4 text-left shadow-subtle transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/30",
              selectedIds.includes(c.id) && "border-brand-purple bg-[rgba(113,50,245,0.05)]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-dashboard-border text-brand-purple"
                checked={selectedIds.includes(c.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => onToggleSelect(c.id)}
                aria-label={`Selecionar ${c.name}`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-black">{c.name}</p>
                <p className="text-xs text-neutral-gray">{c.id}</p>
              </div>
              <CampanhaActionsMenu
                campanha={c}
                onViewDetails={() => onViewDetails(c)}
                onToggleStatus={() => onToggleStatus(c)}
                onDuplicate={() => onDuplicate(c)}
                onEdit={() => onEdit(c)}
                onExport={() => onExport(c)}
                onDelete={() => onDelete(c)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-gray">
              <span className="truncate">{c.account}</span>
              <Badge variant="neutral">{c.structure}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <StatusBadge status={c.status} />
              <span className="text-xs text-neutral-gray">
                {format(c.createdAt, "dd/MM/yy HH:mm", { locale: ptBR })}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-neutral-black">{c.adsCreated}</span>
              <span className="text-neutral-gray"> / {c.adsTotal}</span>
              {c.status === "ativa" ? <MiniProgressBar value={c.adsCreated} total={c.adsTotal} /> : null}
            </div>
          </div>
        ))}
      </div>

      <CampanhasPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />
    </div>
  );
}
