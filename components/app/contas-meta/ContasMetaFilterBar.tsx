"use client";

import { Filter, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ContaSortId, ContaStatusFilterId } from "@/lib/mock-contas";
import type { ContasPageFiltersState } from "@/lib/contas-meta-filters";

const selectClass =
  "rounded-lg border border-dashboard-border bg-neutral-white px-3 py-2 text-sm font-medium text-neutral-black outline-none transition-[border-color,box-shadow] focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20";

const statusOptions: { id: ContaStatusFilterId; label: string }[] = [
  { id: "all", label: "Todos os status" },
  { id: "ativa", label: "Ativa" },
  { id: "token_expirado", label: "Token expirado" },
  { id: "suspensa", label: "Suspensa" },
  { id: "desconectada", label: "Desconectada" },
];

const sortOptions: { id: ContaSortId; label: string }[] = [
  { id: "recent", label: "Mais recente" },
  { id: "name", label: "Nome A–Z" },
  { id: "spend", label: "Maior gasto" },
  { id: "ads", label: "Mais anúncios" },
  { id: "problemFirst", label: "Com problema primeiro" },
];

export function ContasMetaFilterBar({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
}: {
  filters: ContasPageFiltersState;
  onChange: (next: Partial<ContasPageFiltersState>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-3 border-b border-dashboard-border py-4", "max-md:hidden")}>
        <div className="relative w-72 min-w-[200px] max-w-full shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-muted" />
          <input
            type="search"
            placeholder="Buscar por nome ou ID da conta..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full rounded-lg border border-dashboard-border bg-neutral-white py-2 pl-9 pr-3 text-sm text-neutral-black outline-none placeholder:text-neutral-silver focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            aria-label="Buscar conta"
          />
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
          Status
          <select
            className={cn(selectClass, "min-w-[180px]")}
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value as ContaStatusFilterId })}
          >
            {statusOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
          Ordenar por
          <select
            className={cn(selectClass, "min-w-[200px]")}
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as ContaSortId })}
          >
            {sortOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {hasActiveFilters ? (
          <Button type="button" variant="ghost" className="ml-auto px-3 py-2 text-sm" onClick={onClear}>
            <X className="h-3.5 w-3.5" aria-hidden />
            Limpar
          </Button>
        ) : null}
      </div>

      <div className="border-b border-dashboard-border py-3 md:hidden">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-between px-2 py-2 text-sm"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="flex items-center gap-2 font-semibold text-neutral-black">
            <Filter className="h-4 w-4 text-neutral-gray" />
            Filtros e busca
          </span>
        </Button>
        {mobileOpen ? (
          <div className="mt-3 flex flex-col gap-3 px-1 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-muted" />
              <input
                type="search"
                placeholder="Buscar por nome ou ID..."
                value={filters.search}
                onChange={(e) => onChange({ search: e.target.value })}
                className="w-full rounded-lg border border-dashboard-border bg-neutral-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
              />
            </div>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-dashboard-muted">
              Status
              <select
                className={selectClass}
                value={filters.status}
                onChange={(e) => onChange({ status: e.target.value as ContaStatusFilterId })}
              >
                {statusOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-dashboard-muted">
              Ordenar por
              <select
                className={selectClass}
                value={filters.sortBy}
                onChange={(e) => onChange({ sortBy: e.target.value as ContaSortId })}
              >
                {sortOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" className="self-start text-sm" onClick={onClear}>
                <X className="h-3.5 w-3.5" />
                Limpar filtros
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
