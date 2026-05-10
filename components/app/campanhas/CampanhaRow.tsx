"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Campanha } from "@/lib/mock-campanhas";
import { CampanhaActionsMenu } from "./CampanhaActionsMenu";
import { MiniProgressBar } from "./MiniProgressBar";
import { MiniTrendSparkline } from "./MiniTrendSparkline";
import { StatusBadge } from "./StatusBadge";

function initials(name: string) {
  const p = name.trim().split(/\s+/).slice(0, 2);
  return p.map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function CampanhaRow({
  campanha,
  rowIndex,
  selected,
  onToggleSelect,
  onRowClick,
  onViewDetails,
  onToggleStatus,
  onDuplicate,
  onEdit,
  onExport,
  onDelete,
}: {
  campanha: Campanha;
  rowIndex: number;
  selected: boolean;
  onToggleSelect: () => void;
  onRowClick: () => void;
  onViewDetails: () => void;
  onToggleStatus: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const showProgress = campanha.status === "ativa" && campanha.adsTotal > 0;

  return (
    <motion.tr
      layout
      custom={rowIndex}
      variants={{
        hidden: { opacity: 0, x: -8 },
        visible: (i: number) => ({
          opacity: 1,
          x: 0,
          transition: { delay: i * 0.04, duration: 0.2 },
        }),
      }}
      initial="hidden"
      animate="visible"
      className={cn(
        "cursor-pointer border-b border-[#f4f4f8] transition-colors hover:bg-[rgba(113,50,245,0.03)]",
        selected && "border-l-2 border-l-brand-purple bg-[rgba(113,50,245,0.05)]"
      )}
      onClick={onRowClick}
    >
      <td className="w-10 px-4 py-3.5 align-middle" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-dashboard-border text-brand-purple focus:ring-brand-purple"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Selecionar ${campanha.name}`}
        />
      </td>
      <td className="max-w-[280px] px-4 py-3.5 align-middle">
        <p className="truncate font-medium text-neutral-black">{campanha.name}</p>
        <p className="text-xs text-neutral-gray">ID: {campanha.id}</p>
      </td>
      <td className="max-w-[180px] px-4 py-3.5 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-purple-subtle text-xs font-bold text-brand-purple">
            {initials(campanha.account)}
          </span>
          <span className="truncate text-sm text-neutral-black">{campanha.account}</span>
        </div>
      </td>
      <td className="hidden px-4 py-3.5 align-middle lg:table-cell">
        <Badge variant="neutral">{campanha.structure}</Badge>
      </td>
      <td className="px-4 py-3.5 align-middle">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-neutral-black">{campanha.adsCreated}</span>
            <span className="text-xs text-neutral-gray"> / {campanha.adsTotal}</span>
            {showProgress ? (
              <MiniProgressBar value={campanha.adsCreated} total={campanha.adsTotal} />
            ) : null}
          </div>
          <div className="hidden xl:block">
            <MiniTrendSparkline data={campanha.trend} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 align-middle">
        <StatusBadge status={campanha.status} />
      </td>
      <td className="hidden px-4 py-3.5 align-middle lg:table-cell">
        <span className="text-sm text-neutral-gray">
          {format(campanha.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </span>
      </td>
      <td className="w-12 px-2 py-3.5 align-middle" onClick={(e) => e.stopPropagation()}>
        <CampanhaActionsMenu
          campanha={campanha}
          onViewDetails={onViewDetails}
          onToggleStatus={onToggleStatus}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onExport={onExport}
          onDelete={onDelete}
        />
      </td>
    </motion.tr>
  );
}
