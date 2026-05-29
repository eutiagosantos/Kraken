"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Layers, Zap } from "lucide-react";
import {
  formatDurationLabel,
  formatEtaLabel,
  formatPanelNumber,
  type PublicationQueueSummary,
} from "@/lib/publication-queue/compute-panel-summary";
import { cn } from "@/lib/utils";

export type PublicationQueuePanelProps = {
  summary: PublicationQueueSummary;
  /** Landing page: subtle float animation */
  animate?: boolean;
  /** macOS-style title bar */
  showWindowChrome?: boolean;
  /** Wrap panel in link (SaaS home → fila) */
  href?: string;
  className?: string;
};

type StatRow = {
  name: string;
  value: string;
  icon: LucideIcon;
};

export function PublicationQueuePanel({
  summary,
  animate = false,
  showWindowChrome = true,
  href,
  className,
}: PublicationQueuePanelProps) {
  const rows: StatRow[] = [
    {
      name: "Campanhas em fila",
      value: formatPanelNumber(summary.campaignsInQueue),
      icon: Zap,
    },
    {
      name: "Anúncios publicados (hoje)",
      value: formatPanelNumber(summary.adsPublishedToday),
      icon: BarChart3,
    },
    {
      name: "Contas conectadas",
      value: formatPanelNumber(summary.connectedAccounts),
      icon: Layers,
    },
  ];

  const etaLabel = formatEtaLabel(summary.nextBatchEtaSeconds);
  const avgLabel = formatDurationLabel(summary.averageTimeSeconds);
  const progressWidth = `${Math.min(100, Math.max(0, summary.nextBatchProgress))}%`;

  const panel = (
    <div className={cn("relative", className)}>
      <div
        className="absolute -inset-3 rounded-[20px] bg-brand-purple/[0.08] blur-2xl"
        aria-hidden
      />

      <motion.div
        {...(animate
          ? {
              animate: { y: [0, -8, 0] },
              transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }
          : {})}
        className="relative overflow-hidden rounded-[18px] border border-neutral-border bg-white shadow-[0_24px_64px_rgba(16,17,20,0.08)]"
      >
        {showWindowChrome ? (
          <div className="flex items-center gap-2 border-b border-neutral-border bg-[#FAFAF7] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-2 text-xs font-medium text-neutral-silver">
              kraken — fila de publicação
            </span>
          </div>
        ) : null}

        <div className="border-l-4 border-l-brand-purple p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple-subtle text-brand-purple">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-silver">Painel</p>
                <p className="text-sm font-semibold text-neutral-black">
                  Upload em massa
                </p>
              </div>
            </div>
            <span
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold",
                summary.isActive
                  ? "bg-semantic-green-bg text-semantic-green-dark"
                  : "bg-[rgba(148,151,169,0.12)] text-neutral-gray"
              )}
            >
              {summary.isActive ? "Ativo" : "Em espera"}
            </span>
          </div>

          <div className="mt-5 space-y-2">
            {rows.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-xl border border-neutral-border/80 bg-[#FAFAF7] px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <row.icon className="h-4 w-4 text-brand-purple" />
                  <span className="text-sm text-neutral-gray">{row.name}</span>
                </div>
                <span className="font-display text-sm font-bold tabular-nums text-neutral-black">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-brand-purple/15 bg-brand-purple-subtle/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-brand-purple-dark">
                Próximo lote
              </span>
              <span className="font-medium tabular-nums text-neutral-silver">
                {etaLabel ?? "—"}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-neutral-border">
              <div
                className="h-full rounded-full bg-brand-purple transition-[width] duration-500 ease-out"
                style={{ width: progressWidth }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="absolute -bottom-5 -left-4 rounded-xl border border-neutral-border bg-white px-4 py-3 shadow-subtle sm:-left-8">
        <p className="text-xs font-medium text-neutral-silver">Tempo médio</p>
        <p className="font-display text-2xl font-bold tabular-nums text-neutral-black">
          {avgLabel}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-[18px] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/30 focus-visible:ring-offset-2"
      >
        {panel}
      </Link>
    );
  }

  return panel;
}

/** Static demo data for marketing hero */
export const DEMO_PUBLICATION_QUEUE_SUMMARY: PublicationQueueSummary = {
  campaignsInQueue: 124,
  adsPublishedToday: 2480,
  connectedAccounts: 18,
  nextBatchProgress: 72,
  nextBatchEtaSeconds: 58,
  averageTimeSeconds: 58,
  isActive: true,
};
