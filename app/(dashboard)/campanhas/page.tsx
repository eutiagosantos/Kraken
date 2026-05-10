"use client";

import {
  endOfDay,
  endOfMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BulkActionsBar } from "@/components/app/campanhas/BulkActionsBar";
import { CampanhaDetailPanel } from "@/components/app/campanhas/CampanhaDetailPanel";
import { CampanhasHeader } from "@/components/app/campanhas/CampanhasHeader";
import type { SortConfig, SortKey } from "@/components/app/campanhas/CampanhasTable";
import { CampanhasTable } from "@/components/app/campanhas/CampanhasTable";
import { DeleteConfirmModal } from "@/components/app/campanhas/DeleteConfirmModal";
import { EditCampanhaModal } from "@/components/app/campanhas/EditCampanhaModal";
import { ExportModal } from "@/components/app/campanhas/ExportModal";
import type { CampanhaFiltersState } from "@/components/app/campanhas/FilterBar";
import { FilterBar } from "@/components/app/campanhas/FilterBar";
import { StatusTabs } from "@/components/app/campanhas/StatusTabs";
import { useSuccessFeedback } from "@/components/app/ui/SuccessFeedback";
import {
  countCampanhasByTab,
  getCampanhasByStatus,
  mockCampanhas,
  type Campanha,
  type CampanhaTabId,
} from "@/lib/mock-campanhas";

const defaultFilters: CampanhaFiltersState = {
  search: "",
  account: "Todas as contas",
  period: "all",
  structure: "all",
};

function uniqueAccounts(campanhas: Campanha[]): string[] {
  const names = Array.from(new Set(campanhas.map((c) => c.account))).sort();
  return ["Todas as contas", ...names];
}

function matchesPeriod(c: Campanha, period: CampanhaFiltersState["period"], now: Date) {
  if (period === "all" || period === "custom") return true;
  const d = c.createdAt;
  if (period === "7d") return d >= subDays(startOfDay(now), 7);
  if (period === "30d") return d >= subDays(startOfDay(now), 30);
  if (period === "month") {
    return isWithinInterval(d, { start: startOfMonth(now), end: endOfDay(now) });
  }
  if (period === "prev_month") {
    const ref = subMonths(now, 1);
    return isWithinInterval(d, { start: startOfMonth(ref), end: endOfMonth(ref) });
  }
  return true;
}

function sortRows(rows: Campanha[], sort: SortConfig): Campanha[] {
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (sort.column) {
      case "name":
        return a.name.localeCompare(b.name, "pt") * dir;
      case "account":
        return a.account.localeCompare(b.account, "pt") * dir;
      case "ads_count":
        return (a.adsCreated - b.adsCreated) * dir;
      case "created_at":
        return (a.createdAt.getTime() - b.createdAt.getTime()) * dir;
      default:
        return 0;
    }
  });
}

function newId() {
  return `CP_${Math.floor(8000 + Math.random() * 2000)}`;
}

export default function CampanhasPage() {
  const { showSuccess } = useSuccessFeedback();
  const [campanhas, setCampanhas] = useState<Campanha[]>(() => mockCampanhas.map((c) => ({ ...c, creatives: c.creatives.map((x) => ({ ...x })) })));
  const [activeTab, setActiveTab] = useState<CampanhaTabId>("ativas");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<CampanhaFiltersState>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: "created_at", direction: "desc" });
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editCampanha, setEditCampanha] = useState<Campanha | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportCampanha, setExportCampanha] = useState<Campanha | null>(null);
  const [exportBulkCount, setExportBulkCount] = useState(0);

  const now = useMemo(() => new Date(), []);

  const tabCounts = useMemo(() => countCampanhasByTab(campanhas), [campanhas]);

  const filtered = useMemo(() => {
    let rows = getCampanhasByStatus(campanhas, activeTab);
    const q = filters.search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    }
    if (filters.account !== "Todas as contas") {
      rows = rows.filter((c) => c.account === filters.account);
    }
    if (filters.structure !== "all") {
      rows = rows.filter((c) => c.structure === filters.structure);
    }
    rows = rows.filter((c) => matchesPeriod(c, filters.period, now));
    return sortRows(rows, sortConfig);
  }, [campanhas, activeTab, filters, sortConfig, now]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, filters.search, filters.account, filters.period, filters.structure, itemsPerPage]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page, itemsPerPage]);

  const pageIds = useMemo(() => pageRows.map((c) => c.id), [pageRows]);
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id));
  const allSelectedOnPage = pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const indeterminateOnPage = selectedOnPage.length > 0 && !allSelectedOnPage;

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.account !== "Todas as contas" ||
    filters.period !== "all" ||
    filters.structure !== "all";

  const clearFilters = () => setFilters(defaultFilters);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAllPage = useCallback(() => {
    setSelectedIds((prev) => {
      if (pageIds.length === 0) return prev;
      const allIn = pageIds.every((id) => prev.includes(id));
      if (allIn) return prev.filter((id) => !pageIds.includes(id));
      const set = new Set(prev);
      pageIds.forEach((id) => set.add(id));
      return Array.from(set);
    });
  }, [pageIds]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const selectedCampanhas = useMemo(
    () => campanhas.filter((c) => selectedIds.includes(c.id)),
    [campanhas, selectedIds]
  );

  const showPauseBulk = selectedCampanhas.some((c) => c.status === "ativa" || c.status === "processando");
  const showResumeBulk = selectedCampanhas.some((c) => c.status === "pausada");

  const onSort = (column: SortKey) => {
    setSortConfig((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" }
    );
  };

  useEffect(() => {
    const t = window.setInterval(() => {
      setCampanhas((prev) =>
        prev.map((c) => {
          if (c.status !== "processando") return c;
          if (c.adsCreated >= c.adsTotal) {
            return { ...c, adsCreated: c.adsTotal, status: "concluida" as const };
          }
          const step = Math.min(12, c.adsTotal - c.adsCreated);
          return { ...c, adsCreated: c.adsCreated + step };
        })
      );
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const resolveCampanha = useCallback(
    (id: string) => campanhas.find((c) => c.id === id) ?? null,
    [campanhas]
  );

  const panelCampanha = selectedCampanha?.id ? resolveCampanha(selectedCampanha.id) : null;

  const pauseOne = (c: Campanha) => {
    if (c.status !== "ativa" && c.status !== "processando") return;
    setCampanhas((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, status: "pausada" as const } : x))
    );
  };

  const resumeOne = (c: Campanha) => {
    if (c.status !== "pausada") return;
    setCampanhas((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, status: "ativa" as const } : x))
    );
  };

  const toggleStatusOne = (c: Campanha) => {
    if (c.status === "ativa" || c.status === "processando") pauseOne(c);
    else if (c.status === "pausada") resumeOne(c);
  };

  const duplicateOne = (c: Campanha) => {
    const copy: Campanha = {
      ...c,
      id: newId(),
      name: `${c.name} (cópia)`,
      createdAt: new Date(),
      status: "ativa",
      adsCreated: Math.min(c.adsTotal, c.adsCreated),
      creatives: c.creatives.map((cr) => ({ ...cr, id: `${cr.id}_dup` })),
    };
    setCampanhas((prev) => [copy, ...prev]);
  };

  const deleteByIds = (ids: string[]) => {
    setCampanhas((prev) => prev.filter((c) => !ids.includes(c.id)));
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    setPanelOpen(false);
    setSelectedCampanha(null);
  };

  const bulkPause = () => {
    setCampanhas((prev) =>
      prev.map((c) =>
        selectedIds.includes(c.id) && (c.status === "ativa" || c.status === "processando")
          ? { ...c, status: "pausada" as const }
          : c
      )
    );
  };

  const bulkResume = () => {
    setCampanhas((prev) =>
      prev.map((c) => (selectedIds.includes(c.id) && c.status === "pausada" ? { ...c, status: "ativa" as const } : c))
    );
  };

  const bulkDuplicate = () => {
    const toDup = campanhas.filter((c) => selectedIds.includes(c.id));
    const copies = toDup.map((c) => ({
      ...c,
      id: newId(),
      name: `${c.name} (cópia)`,
      createdAt: new Date(),
      status: "ativa" as const,
      creatives: c.creatives.map((cr) => ({ ...cr, id: `${cr.id}_${Math.random().toString(36).slice(2, 7)}` })),
    }));
    setCampanhas((prev) => [...copies, ...prev]);
  };

  const openDelete = (ids: string[]) => {
    setDeleteIds(ids);
    setDeleteCount(ids.length);
    setDeleteOpen(true);
  };

  const accountOptions = useMemo(() => uniqueAccounts(campanhas), [campanhas]);

  return (
    <div className="mx-auto max-w-[1680px]">
      <CampanhasHeader
        total={campanhas.length}
        ativas={tabCounts.ativas}
        concluidas={tabCounts.concluidas}
        comErro={tabCounts.erro}
      />

      <FilterBar
        filters={filters}
        onChange={(next) => setFilters((f) => ({ ...f, ...next }))}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        accountOptions={accountOptions}
      />

      <StatusTabs activeTab={activeTab} onChange={setActiveTab} counts={tabCounts}>
        <BulkActionsBar
          selectedCount={selectedIds.length}
          allSelected={allSelectedOnPage}
          indeterminate={indeterminateOnPage}
          onToggleSelectAll={toggleSelectAllPage}
          activeTab={activeTab}
          showPause={showPauseBulk}
          showResume={showResumeBulk}
          onPause={bulkPause}
          onResume={bulkResume}
          onDuplicate={bulkDuplicate}
          onExport={() => {
            setExportCampanha(null);
            setExportBulkCount(selectedIds.length);
            setExportOpen(true);
          }}
          onDelete={() => openDelete(selectedIds)}
        />

        <CampanhasTable
          rows={pageRows}
          activeTab={activeTab}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAllPage={toggleSelectAllPage}
          allSelectedOnPage={allSelectedOnPage}
          indeterminateOnPage={indeterminateOnPage}
          sortConfig={sortConfig}
          onSort={onSort}
          onRowClick={(c) => {
            setSelectedCampanha(c);
            setPanelOpen(true);
          }}
          onViewDetails={(c) => {
            setSelectedCampanha(c);
            setPanelOpen(true);
          }}
          onToggleStatus={toggleStatusOne}
          onDuplicate={duplicateOne}
          onEdit={(c) => {
            setEditCampanha(c);
            setEditOpen(true);
          }}
          onExport={(c) => {
            setExportCampanha(c);
            setExportBulkCount(0);
            setExportOpen(true);
          }}
          onDelete={(c) => openDelete([c.id])}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onPerPageChange={(n) => {
            setItemsPerPage(n);
            setPage(1);
          }}
        />
      </StatusTabs>

      <CampanhaDetailPanel
        campanha={panelCampanha}
        open={panelOpen && !!panelCampanha}
        onClose={() => {
          setPanelOpen(false);
        }}
        onExport={(c) => {
          setExportCampanha(c);
          setExportBulkCount(0);
          setExportOpen(true);
        }}
        onDuplicate={duplicateOne}
        onPause={pauseOne}
        onResume={resumeOne}
      />

      <EditCampanhaModal
        campanha={editCampanha}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditCampanha(null);
        }}
        onSave={(id, patch) => {
          setCampanhas((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
          );
          showSuccess("Campanha atualizada com sucesso.");
        }}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        count={deleteCount}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          const n = deleteIds.length;
          deleteByIds(deleteIds);
          showSuccess(n > 1 ? "Campanhas excluídas com sucesso." : "Campanha excluída com sucesso.");
        }}
      />

      <ExportModal
        campanha={exportCampanha}
        selectionCount={exportBulkCount || undefined}
        open={exportOpen}
        onClose={() => {
          setExportOpen(false);
          setExportCampanha(null);
          setExportBulkCount(0);
        }}
        onExport={() => {
          showSuccess("Relatório exportado com sucesso.");
        }}
      />
    </div>
  );
}
