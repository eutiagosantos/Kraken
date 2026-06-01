"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, BarChart3, Clock, Layers, Zap } from "lucide-react";
import {
  formatDurationLabel,
  formatEtaLabel,
  formatPanelNumber,
  type PublicationQueueSummary,
} from "@/libs/publication-queue/compute-panel-summary";
import { cn } from "@/libs/utils";

export type PublicationQueuePanelVariant = "app" | "marketing";

export type PublicationQueuePanelProps = {
  summary: PublicationQueueSummary;
  variant?: PublicationQueuePanelVariant;
  /** Landing only: subtle float animation */
  animate?: boolean;
  /** Wrap panel in link (SaaS home → fila) */
  href?: string;
  className?: string;
};

type StatRow = {
  name: string;
  value: string;
  icon: LucideIcon;
};

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        isActive
          ? "bg-semantic-green-bg text-semantic-green-dark"
          : "bg-dashboard-sidebar-ghost text-neutral-gray"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isActive ? "animate-pulse bg-semantic-green" : "bg-neutral-silver"
        )}
        aria-hidden
      />
      {isActive ? "Ativo" : "Em espera"}
    </span>
  );
}

function AppPublicationQueuePanel({
  summary,
  href,
  className,
}: Omit<PublicationQueuePanelProps, "variant" | "animate">) {
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
    <section
      className={cn(
        "overflow-hidden rounded-card border border-dashboard-border bg-dashboard-surface shadow-subtle",
        href && "transition-shadow hover:shadow-card",
        className
      )}
    >
      <div className="border-b border-dashboard-border/80 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
              Fila de publicação
            </p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-neutral-black">
              Upload em massa
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge isActive={summary.isActive} />
            {href ? (
              <ArrowUpRight
                className="h-4 w-4 text-brand-purple opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-dashboard-border/60 sm:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.name}
            className="flex flex-col gap-3 bg-dashboard-surface px-5 py-4 sm:px-6"
          >
            <div className="flex items-center gap-2">
              <row.icon className="h-4 w-4 shrink-0 text-brand-purple" strokeWidth={1.75} />
              <span className="text-xs font-medium leading-snug text-dashboard-muted">
                {row.name}
              </span>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-neutral-black">
              {row.value}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-dashboard-border/80 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-neutral-black">Próximo lote</span>
              <span className="shrink-0 font-medium tabular-nums text-dashboard-muted">
                {etaLabel ?? "—"}
              </span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-dashboard-track">
              <div
                className="h-full rounded-full bg-brand-purple transition-[width] duration-500 ease-out"
                style={{ width: progressWidth }}
                role="progressbar"
                aria-valuenow={summary.nextBatchProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-base/80 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-purple-subtle text-brand-purple">
              <Clock className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-dashboard-muted">Tempo médio</p>
              <p className="font-display text-xl font-bold tabular-nums leading-none text-neutral-black">
                {avgLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/30 focus-visible:ring-offset-2"
      >
        {panel}
      </Link>
    );
  }

  return panel;
}

function MarketingPublicationQueuePanel({
  summary,
  animate = false,
  className,
}: Omit<PublicationQueuePanelProps, "variant" | "href">) {
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

  return (
    <div className={cn("relative pb-8", className)}>
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
        <div className="flex items-center gap-2 border-b border-neutral-border bg-[#FAFAF7] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 text-xs font-medium text-neutral-silver">
            kraken — fila de publicação
          </span>
        </div>

        <div className="border-l-4 border-l-brand-purple p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple-subtle text-brand-purple">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-silver">Painel</p>
                <p className="text-sm font-semibold text-neutral-black">Upload em massa</p>
              </div>
            </div>
            <StatusBadge isActive={summary.isActive} />
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
              <span className="font-semibold text-brand-purple-dark">Próximo lote</span>
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
}

export function PublicationQueuePanel({
  summary,
  variant = "app",
  animate = false,
  href,
  className,
}: PublicationQueuePanelProps) {
  if (variant === "marketing") {
    return (
      <MarketingPublicationQueuePanel
        summary={summary}
        animate={animate}
        className={className}
      />
    );
  }

  return (
    <AppPublicationQueuePanel summary={summary} href={href} className={className} />
  );
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
