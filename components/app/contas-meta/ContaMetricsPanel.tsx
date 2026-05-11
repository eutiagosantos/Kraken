"use client";

import { AnimatePresence, motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { Button } from "@/components/ui/Button";
import { InfoRow } from "@/components/app/ui/InfoRow";
import { PanelFooter } from "@/components/app/ui/PanelFooter";
import { cn } from "@/lib/utils";
import type { ContaMeta } from "@/lib/mock-contas";
import { AccountAvatar } from "./AccountAvatar";
import { ContaStatusBadge } from "./ContaStatusBadge";

const periodOptions = ["7 dias", "30 dias", "90 dias", "Este mês"] as const;
export type MetricsPeriod = (typeof periodOptions)[number];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dashboard-muted">{title}</h3>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  delta,
  deltaType,
}: {
  label: string;
  value: string;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
}) {
  const dc =
    deltaType === "positive"
      ? "text-semantic-green"
      : deltaType === "negative"
        ? "text-semantic-red"
        : "text-neutral-silver";
  return (
    <div className="rounded-xl border border-dashboard-border bg-dashboard-base p-3">
      <p className="text-xs font-medium text-neutral-gray">{label}</p>
      <p className="mt-1 text-lg font-bold text-neutral-black">{value}</p>
      <p className={cn("mt-0.5 text-xs font-medium", dc)}>{delta}</p>
    </div>
  );
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: MetricsPeriod;
  onChange: (p: MetricsPeriod) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {periodOptions.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            value === p ? "bg-brand-purple text-white" : "bg-dashboard-track text-neutral-gray hover:text-neutral-black"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function SpendLineChart({ data, gradientId }: { data: { day: string; value: number }[]; gradientId: string }) {
  const isClient = useIsClient();
  return (
    <div className="h-[160px] w-full">
      {isClient ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7132f5" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#7132f5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9497a9" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v) => [`R$ ${(v as number).toLocaleString("pt-BR")}`, "Gasto"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#7132f5"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full" aria-hidden />
      )}
    </div>
  );
}

function AdsStatusBreakdown({
  approved,
  pending,
  rejected,
}: {
  approved: number;
  pending: number;
  rejected: number;
}) {
  const total = approved + pending + rejected || 1;
  const pa = (approved / total) * 100;
  const pp = (pending / total) * 100;
  const pr = (rejected / total) * 100;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-dashboard-track">
        <div className="h-full bg-semantic-green" style={{ width: `${pa}%` }} />
        <div className="h-full bg-semantic-yellow" style={{ width: `${pp}%` }} />
        <div className="h-full bg-semantic-red" style={{ width: `${pr}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        <span className="text-neutral-black">
          <span className="font-semibold text-semantic-green">{approved}</span> aprovados ({pa.toFixed(0)}%)
        </span>
        <span className="text-neutral-black">
          <span className="font-semibold text-semantic-yellow">{pending}</span> pendentes ({pp.toFixed(0)}%)
        </span>
        <span className="text-neutral-black">
          <span className="font-semibold text-semantic-red">{rejected}</span> rejeitados ({pr.toFixed(0)}%)
        </span>
      </div>
    </div>
  );
}

function UploadRow({ upload }: { upload: ContaMeta["recentUploads"][number] }) {
  const statusClass =
    upload.status === "concluida"
      ? "bg-[rgba(20,158,97,0.12)] text-semantic-green"
      : upload.status === "processando"
        ? "bg-semantic-yellow-bg text-semantic-yellow"
        : "bg-semantic-red-bg text-semantic-red";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashboard-border py-2 text-sm last:border-0">
      <span className="text-neutral-gray">{format(upload.date, "dd/MM/yyyy", { locale: ptBR })}</span>
      <span className="font-medium text-neutral-black">{upload.campaigns} campanhas</span>
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", statusClass)}>
        {upload.status}
      </span>
    </div>
  );
}

export function ContaMetricsPanel({
  conta,
  open,
  onClose,
  onEdit,
  onReconnect,
}: {
  conta: ContaMeta | null;
  open: boolean;
  onClose: () => void;
  onEdit: (c: ContaMeta) => void;
  onReconnect: (c: ContaMeta) => void;
}) {
  const [layout, setLayout] = useState<"bottom" | "full" | "side">("side");
  const [period, setPeriod] = useState<MetricsPeriod>("7 dias");

  useEffect(() => {
    const pick = () => {
      const w = window.innerWidth;
      if (w < 768) setLayout("bottom");
      else if (w < 1024) setLayout("full");
      else setLayout("side");
    };
    pick();
    window.addEventListener("resize", pick);
    return () => window.removeEventListener("resize", pick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const chartData = useMemo(() => {
    if (!conta) return [];
    const mult =
      period === "7 dias" ? 1 : period === "30 dias" ? 1.15 : period === "90 dias" ? 1.35 : 1.08;
    return conta.spendSeriesExtended.map((d) => ({ ...d, value: Math.round(d.value * mult) }));
  }, [conta, period]);

  const tokenLabel =
    conta?.tokenStatus === "valido" ? "Válido" : conta?.tokenStatus === "expirando" ? "Expirando" : "Expirado";

  return (
    <AnimatePresence>
      {open && conta ? (
        <>
          <motion.button
            type="button"
            aria-label="Fechar painel"
            className="fixed inset-0 z-[100] bg-[rgba(16,17,20,0.25)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="conta-metrics-title"
            className={cn(
              "fixed z-[101] flex flex-col overflow-y-auto bg-neutral-white shadow-[rgba(0,0,0,0.12)_-8px_0px_32px]",
              layout === "side" && "bottom-0 right-0 top-14 w-full max-w-[420px] border-l border-dashboard-border",
              layout === "full" && "bottom-0 right-0 top-14 w-full border-l border-dashboard-border",
              layout === "bottom" &&
                "bottom-0 left-0 right-0 h-[80vh] max-h-[80vh] rounded-t-2xl border-t border-dashboard-border"
            )}
            initial={layout === "bottom" ? { y: "100%", opacity: 0 } : { x: "100%", opacity: 0 }}
            animate={layout === "bottom" ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={layout === "bottom" ? { y: "100%", opacity: 0 } : { x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-dashboard-border bg-neutral-white px-5 py-4">
              <AccountAvatar name={conta.name} size="sm" />
              <div className="min-w-0 flex-1">
                <h2 id="conta-metrics-title" className="truncate font-display text-lg font-bold text-neutral-black">
                  {conta.name}
                </h2>
                <p className="mt-0.5 text-xs text-neutral-gray">ID: {conta.accountId}</p>
                <div className="mt-2">
                  <ContaStatusBadge status={conta.status} />
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-neutral-gray hover:bg-dashboard-sidebar-ghost"
                onClick={onClose}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 px-5 py-5">
              <PeriodSelector value={period} onChange={setPeriod} />

              <Section title="Resumo do Período">
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Gasto Total"
                    value={`R$ ${conta.monthlySpend.toLocaleString("pt-BR")}`}
                    delta={conta.spendDelta}
                    deltaType={conta.spendDeltaType}
                  />
                  <MetricCard
                    label="Anúncios Criados"
                    value={String(conta.totalAds)}
                    delta={`+${conta.adsThisMonth} este período`}
                    deltaType="positive"
                  />
                  <MetricCard
                    label="Taxa de Aprovação"
                    value={`${conta.approvalRate}%`}
                    delta={conta.approvalDelta}
                    deltaType={conta.approvalRate >= 95 ? "positive" : "negative"}
                  />
                  <MetricCard
                    label="Uploads Realizados"
                    value={String(conta.uploadsInPeriod)}
                    delta={`${conta.uploadsWithError} com erro`}
                    deltaType={conta.uploadsWithError > 0 ? "negative" : "neutral"}
                  />
                </div>
              </Section>

              <Section title="Evolução do Gasto">
                <SpendLineChart data={chartData} gradientId={`panel-spark-${conta.id}`} />
              </Section>

              <Section title="Anúncios por Status">
                <AdsStatusBreakdown
                  approved={conta.adsApproved}
                  pending={conta.adsPending}
                  rejected={conta.adsRejected}
                />
              </Section>

              <Section title="Uploads Recentes">
                {conta.recentUploads.length === 0 ? (
                  <p className="text-sm text-neutral-gray">Nenhum upload recente.</p>
                ) : (
                  conta.recentUploads.map((u) => <UploadRow key={u.id} upload={u} />)
                )}
              </Section>

              <Section title="Conexão">
                <div className="rounded-xl border border-dashboard-border bg-dashboard-base px-3">
                  <InfoRow label="Conectada em" value={format(conta.connectedAt, "dd/MM/yyyy", { locale: ptBR })} />
                  <InfoRow label="Token" value={tokenLabel} />
                  <InfoRow label="Expira em" value={format(conta.tokenExpiresAt, "dd/MM/yyyy", { locale: ptBR })} />
                  <InfoRow
                    label="Última atividade"
                    value={formatDistanceToNow(conta.lastActivity, { locale: ptBR, addSuffix: true })}
                  />
                </div>
              </Section>
            </div>

            <PanelFooter>
              <Button
                type="button"
                variant="outlined"
                className="min-w-[120px] flex-1 py-2.5 text-sm"
                onClick={() => onEdit(conta)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button
                type="button"
                variant="outlined"
                className="min-w-[120px] flex-1 py-2.5 text-sm"
                onClick={() => onReconnect(conta)}
              >
                <RefreshCw className="h-4 w-4" />
                Reconectar
              </Button>
            </PanelFooter>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
