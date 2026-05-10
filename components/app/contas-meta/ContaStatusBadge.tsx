"use client";

import { cn } from "@/lib/utils";
import type { ContaStatus } from "@/lib/mock-contas";
import { HealthIndicator } from "./HealthIndicator";

const statusConfig: Record<
  ContaStatus,
  { label: string; bg: string; text: string; dot: string; pulse?: boolean }
> = {
  ativa: {
    label: "Ativa",
    bg: "rgba(20,158,97,0.12)",
    text: "#149e61",
    dot: "#149e61",
  },
  token_expirado: {
    label: "Token Expirado",
    bg: "rgba(217,119,6,0.10)",
    text: "#d97706",
    dot: "#d97706",
    pulse: true,
  },
  suspensa: {
    label: "Suspensa",
    bg: "rgba(229,62,62,0.10)",
    text: "#e53e3e",
    dot: "#e53e3e",
  },
  desconectada: {
    label: "Desconectada",
    bg: "rgba(104,107,130,0.10)",
    text: "#686b82",
    dot: "#686b82",
  },
  reconectando: {
    label: "Reconectando...",
    bg: "rgba(113,50,245,0.12)",
    text: "#7132f5",
    dot: "#7132f5",
    pulse: true,
  },
};

export function ContaStatusBadge({ status, className }: { status: ContaStatus; className?: string }) {
  const c = statusConfig[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", className)}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <HealthIndicator color={c.dot} pulse={c.pulse} />
      {c.label}
    </span>
  );
}
