"use client";

import { cn } from "@/lib/utils";
import type { CampanhaStatus } from "@/lib/mock-campanhas";

const statusConfig: Record<
  CampanhaStatus,
  { label: string; bg: string; text: string; dot: string; pulse?: boolean }
> = {
  ativa: {
    label: "Ativa",
    bg: "rgba(113,50,245,0.12)",
    text: "#7132f5",
    dot: "#7132f5",
    pulse: true,
  },
  processando: {
    label: "Processando",
    bg: "rgba(217,119,6,0.10)",
    text: "#d97706",
    dot: "#d97706",
    pulse: true,
  },
  concluida: {
    label: "Concluída",
    bg: "rgba(20,158,97,0.12)",
    text: "#149e61",
    dot: "#149e61",
  },
  pausada: {
    label: "Pausada",
    bg: "rgba(104,107,130,0.10)",
    text: "#686b82",
    dot: "#686b82",
  },
  erro: {
    label: "Com Erro",
    bg: "rgba(229,62,62,0.10)",
    text: "#e53e3e",
    dot: "#e53e3e",
  },
};

export function StatusBadge({ status, className }: { status: CampanhaStatus; className?: string }) {
  const c = statusConfig[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", className)}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.pulse && "animate-pulse")}
        style={{ backgroundColor: c.dot }}
        aria-hidden
      />
      {c.label}
    </span>
  );
}
