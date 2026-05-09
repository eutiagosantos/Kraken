"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function CampanhasPagination({
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 25, 50, 100],
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
  perPageOptions?: number[];
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalItems);

  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    pages.push(1);
    if (left > 2) pages.push("ellipsis");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-dashboard-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-neutral-gray">
        Mostrando{" "}
        <span className="font-semibold text-neutral-black">
          {start}–{end}
        </span>{" "}
        de <span className="font-semibold text-neutral-black">{totalItems}</span> campanhas
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-neutral-gray">
          Por página
          <select
            value={itemsPerPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded-lg border border-dashboard-border bg-neutral-white px-2 py-1.5 text-sm font-medium text-neutral-black outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            className="px-2 py-2 text-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          <div className="flex items-center gap-0.5 px-1">
            {pages.map((p, idx) =>
              p === "ellipsis" ? (
                <span key={`e-${idx}`} className="px-1 text-neutral-silver">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={cn(
                    "min-w-[2rem] rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors",
                    p === page
                      ? "bg-brand-purple-subtle text-brand-purple"
                      : "text-neutral-gray hover:bg-dashboard-sidebar-ghost hover:text-neutral-black"
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="px-2 py-2 text-sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Próxima"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
