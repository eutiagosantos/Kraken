"use client";

import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Layers,
  Pencil,
  RefreshCw,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ContaMeta, ContaStatus } from "@/lib/mock-contas";
import { AccountAvatar } from "./AccountAvatar";
import { ContaActionsMenu } from "./ContaActionsMenu";
import { ContaStatusBadge } from "./ContaStatusBadge";
import { SparklineChart } from "./SparklineChart";

function MetricItem({
  icon,
  label,
  value,
  delta,
  deltaType,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
}) {
  const deltaColor =
    deltaType === "positive"
      ? "text-semantic-green"
      : deltaType === "negative"
        ? "text-semantic-red"
        : "text-neutral-silver";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.04em] text-neutral-silver">
        {icon}
        {label}
      </span>
      <span className="text-xl font-bold text-neutral-black">{value}</span>
      <span className={cn("text-[11px] font-medium", deltaColor)}>{delta}</span>
    </div>
  );
}

function TokenStatusLine({ conta }: { conta: ContaMeta }) {
  if (conta.tokenStatus === "expirado") {
    return (
      <span className="flex items-center gap-1 text-semantic-red">
        <ShieldX className="h-3 w-3 shrink-0" aria-hidden />
        Token expirado
      </span>
    );
  }
  if (conta.tokenStatus === "expirando") {
    const days = Math.max(0, differenceInCalendarDays(conta.tokenExpiresAt, new Date()));
    return (
      <span className="flex items-center gap-1 text-semantic-yellow">
        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
        Expira em {days} dias
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-semantic-green">
      <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden />
      Token válido
    </span>
  );
}

function AlertChip({
  conta,
  onReconnect,
}: {
  conta: ContaMeta;
  onReconnect: () => void;
}) {
  if (conta.status === "ativa") return null;
  if (conta.status === "token_expirado") {
    return (
      <button
        type="button"
        onClick={onReconnect}
        className="flex items-center gap-1 rounded-full bg-semantic-yellow-bg px-3 py-1.5 text-xs font-medium text-semantic-yellow transition-[filter] hover:brightness-95"
      >
        <RefreshCw className="h-3 w-3" aria-hidden />
        Reconectar
      </button>
    );
  }
  if (conta.status === "suspensa") {
    return (
      <button
        type="button"
        onClick={() => window.open("https://business.facebook.com/", "_blank", "noopener,noreferrer")}
        className="flex items-center gap-1 rounded-full bg-semantic-red-bg px-3 py-1.5 text-xs font-medium text-semantic-red"
      >
        <ExternalLink className="h-3 w-3" aria-hidden />
        Ver no Meta
      </button>
    );
  }
  if (conta.status === "desconectada") {
    return (
      <button
        type="button"
        onClick={onReconnect}
        className="flex items-center gap-1 rounded-full bg-[rgba(104,107,130,0.10)] px-3 py-1.5 text-xs font-medium text-neutral-gray hover:bg-[rgba(104,107,130,0.16)]"
      >
        <RefreshCw className="h-3 w-3" aria-hidden />
        Reconectar
      </button>
    );
  }
  return null;
}

function cardTopAccent(status: ContaStatus): string | undefined {
  if (status === "ativa") return undefined;
  if (status === "token_expirado") return "border-t-[3px] border-t-semantic-yellow";
  if (status === "reconectando") return "border-t-[3px] border-t-brand-purple";
  return "border-t-[3px] border-t-semantic-red";
}

export function ContaCard({
  conta,
  onOpenMetrics,
  onEdit,
  onReconnect,
  onDisconnect,
  cardVariants,
}: {
  conta: ContaMeta;
  onOpenMetrics: () => void;
  onEdit: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
  cardVariants?: Variants;
}) {
  const [copied, setCopied] = useState(false);
  const accent = cardTopAccent(conta.status);

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, boxShadow: "0px 12px 32px rgba(113,50,245,0.10)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-card border border-dashboard-border bg-neutral-white p-6 shadow-[rgba(0,0,0,0.03)_0px_4px_16px] transition-[border-color,box-shadow] hover:border-[#dedee5]",
        accent
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AccountAvatar name={conta.name} size="md" />
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-neutral-black">{conta.name}</h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-neutral-gray">
              <span>ID: {conta.accountId}</span>
              <button
                type="button"
                className="rounded p-0.5 text-neutral-gray hover:bg-dashboard-sidebar-ghost hover:text-brand-purple"
                aria-label="Copiar ID"
                onClick={async () => {
                  await navigator.clipboard.writeText(conta.accountId);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="sr-only">{copied ? "Copiado" : "Copiar"}</span>
              </button>
            </p>
          </div>
        </div>
        <ContaStatusBadge status={conta.status} className="shrink-0" />
      </div>

      <hr className="my-4 border-dashboard-border" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricItem
          icon={<DollarSign className="h-3.5 w-3.5" />}
          label="Gasto mensal"
          value={`R$ ${conta.monthlySpend.toLocaleString("pt-BR")}`}
          delta={conta.spendDelta}
          deltaType={conta.spendDeltaType}
        />
        <MetricItem
          icon={<Layers className="h-3.5 w-3.5" />}
          label="Anúncios criados"
          value={conta.totalAds.toLocaleString("pt-BR")}
          delta={`+${conta.adsThisMonth} este mês`}
          deltaType="positive"
        />
        <MetricItem
          icon={<CheckCircle className="h-3.5 w-3.5" />}
          label="Taxa de aprovação"
          value={`${conta.approvalRate}%`}
          delta={conta.approvalDelta}
          deltaType={conta.approvalRate >= 95 ? "positive" : "negative"}
        />
      </div>

      <hr className="my-4 border-dashboard-border" />

      <div>
        <p className="mb-2 text-xs text-neutral-gray">Gasto — últimos 7 dias</p>
        <SparklineChart data={conta.spendHistory} gradientId={`spark-${conta.id}`} height={48} />
      </div>

      <hr className="my-4 border-dashboard-border" />

      <div className="flex flex-col gap-2 text-xs text-neutral-gray sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
            Conectada em {format(conta.connectedAt, "dd/MM/yyyy", { locale: ptBR })}
          </span>
          <TokenStatusLine conta={conta} />
        </div>
        <AlertChip conta={conta} onReconnect={onReconnect} />
      </div>

      <hr className="my-4 border-dashboard-border" />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="subtle" className="py-2 text-sm" onClick={onOpenMetrics}>
          <BarChart2 className="h-4 w-4" aria-hidden />
          Ver Métricas
        </Button>
        <Button type="button" variant="outlined" className="py-2 text-sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" aria-hidden />
          Editar
        </Button>
        <div className="ml-auto">
          <ContaActionsMenu
            conta={conta}
            onOpenMetrics={onOpenMetrics}
            onEdit={onEdit}
            onReconnect={onReconnect}
            onOpenMeta={() => window.open("https://business.facebook.com/", "_blank", "noopener,noreferrer")}
            onDisconnect={onDisconnect}
          />
        </div>
      </div>
    </motion.div>
  );
}
