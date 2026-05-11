"use client";

import { Filter, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type PeriodFilterId = "7d" | "30d" | "month" | "prev_month" | "custom" | "all";

export interface CampanhaFiltersState {
  search: string;
  account: string;
  period: PeriodFilterId;
  structure: string;
}

const selectClass =
  "rounded-lg border border-dashboard-border bg-neutral-white px-3 py-2 text-sm font-medium text-neutral-black outline-none transition-[border-color,box-shadow] focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20";

export function FilterBar({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
  accountOptions,
}: {
  filters: CampanhaFiltersState;
  onChange: (next: Partial<CampanhaFiltersState>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  accountOptions: string[];
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 border-b border-dashboard-border py-4",
          "max-md:hidden"
        )}
      >
        <div className="relative w-72 min-w-[200px] max-w-full shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-muted" />
          <input
            type="search"
            placeholder="Buscar campanha por nome ou ID..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full rounded-lg border border-dashboard-border bg-neutral-white py-2 pl-9 pr-3 text-sm text-neutral-black outline-none placeholder:text-neutral-silver focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            aria-label="Buscar campanha"
          />
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
          Conta
          <select
            className={cn(selectClass, "min-w-[160px]")}
            value={filters.account}
            onChange={(e) => onChange({ account: e.target.value })}
          >
            {accountOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
          Período
          <select
            className={cn(selectClass, "min-w-[150px]")}
            value={filters.period}
            onChange={(e) => onChange({ period: e.target.value as PeriodFilterId })}
          >
            <option value="all">Todos</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="month">Este mês</option>
            <option value="prev_month">Mês anterior</option>
            <option value="custom">Personalizado</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
          Estrutura
          <select
            className={cn(selectClass, "min-w-[120px]")}
            value={filters.structure}
            onChange={(e) => onChange({ structure: e.target.value })}
          >
            <option value="all">Todas</option>
            <option value="1-50-1">1-50-1</option>
            <option value="1-3-5">1-3-5</option>
            <option value="1-1-5">1-1-5</option>
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
          variant="secondary"
          className="w-full justify-center gap-2 py-2.5 text-sm"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Filtrar
        </Button>
        {mobileFiltersOpen ? (
          <div
            className="fixed inset-0 z-[110] flex flex-col bg-neutral-black/40 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <div
              className="mt-auto max-h-[85vh] overflow-y-auto rounded-t-2xl bg-dashboard-surface p-4 shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-neutral-black">Filtros</p>
                <button
                  type="button"
                  className="rounded-lg p-2 text-neutral-gray hover:bg-dashboard-sidebar-ghost"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <label className="text-xs font-semibold uppercase text-dashboard-muted">Busca</label>
                <input
                  type="search"
                  placeholder="Nome ou ID..."
                  value={filters.search}
                  onChange={(e) => onChange({ search: e.target.value })}
                  className="w-full rounded-lg border border-dashboard-border px-3 py-2.5 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
                />
                <label className="text-xs font-semibold uppercase text-dashboard-muted">Conta</label>
                <select
                  className={selectClass}
                  value={filters.account}
                  onChange={(e) => onChange({ account: e.target.value })}
                >
                  {accountOptions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <label className="text-xs font-semibold uppercase text-dashboard-muted">Período</label>
                <select
                  className={selectClass}
                  value={filters.period}
                  onChange={(e) => onChange({ period: e.target.value as PeriodFilterId })}
                >
                  <option value="all">Todos</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="month">Este mês</option>
                  <option value="prev_month">Mês anterior</option>
                  <option value="custom">Personalizado</option>
                </select>
                <label className="text-xs font-semibold uppercase text-dashboard-muted">Estrutura</label>
                <select
                  className={selectClass}
                  value={filters.structure}
                  onChange={(e) => onChange({ structure: e.target.value })}
                >
                  <option value="all">Todas</option>
                  <option value="1-50-1">1-50-1</option>
                  <option value="1-3-5">1-3-5</option>
                  <option value="1-1-5">1-1-5</option>
                </select>
                <div className="flex gap-2 pt-2">
                  {hasActiveFilters ? (
                    <Button type="button" variant="ghost" className="flex-1" onClick={onClear}>
                      Limpar
                    </Button>
                  ) : null}
                  <Button type="button" variant="primary" className="flex-1" onClick={() => setMobileFiltersOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
