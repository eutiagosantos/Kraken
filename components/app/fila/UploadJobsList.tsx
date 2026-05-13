"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { InfoRow } from "@/components/app/ui/InfoRow";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { formatBrl } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import type {
  UploadJobErrorDetailsV1,
  UploadJobSummaryV1,
} from "@/lib/api/upload-job-summary-schema";

export type UploadJobListRow = {
  id: string;
  account_name: string;
  total: number;
  done: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  summary: UploadJobSummaryV1 | null;
  error_details: UploadJobErrorDetailsV1 | null;
};

function budgetPeriodLabel(period?: string) {
  if (period === "lifetime") return "orçamento vitalício";
  if (period === "daily") return "orçamento diário";
  return period ?? "—";
}

function statusPillClasses(status: string) {
  switch (status) {
    case "processing":
      return "bg-[rgba(217,119,6,0.14)] text-[#b45309]";
    case "completed":
      return "bg-semantic-green-bg text-semantic-green-dark";
    case "error":
      return "bg-semantic-red-bg text-semantic-red";
    case "awaiting_creatives":
      return "bg-[rgba(104,107,130,0.14)] text-[#484b5e]";
    default:
      return "bg-[rgba(104,107,130,0.14)] text-[#484b5e]";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "processing":
      return "A processar";
    case "completed":
      return "Concluído";
    case "error":
      return "Erro";
    case "awaiting_creatives":
      return "À espera de criativos";
    default:
      return status;
  }
}

function statusBadge(status: string) {
  const label = statusLabel(status);
  if (status === "completed") {
    return (
      <Badge variant="success" className="rounded-full px-3 py-1 font-ui text-xs font-semibold">
        {label}
      </Badge>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 rounded-full px-3 py-1 font-ui text-xs font-semibold",
        statusPillClasses(status)
      )}
    >
      {label}
    </span>
  );
}

function statusIconTint(status: string) {
  switch (status) {
    case "processing":
      return "bg-[#f59e0b]";
    case "completed":
      return "bg-semantic-green";
    case "error":
      return "bg-semantic-red";
    case "awaiting_creatives":
      return "bg-[#94a3b8]";
    default:
      return "bg-neutral-gray";
  }
}

function shortJobId(id: string) {
  const compact = id.replace(/-/g, "");
  const slice = compact.slice(0, 6).toUpperCase();
  return `#${slice || "—"}`;
}

function entityInitials(accountName: string, s: UploadJobSummaryV1 | null) {
  const first = s?.accounts?.[0]?.name?.trim();
  const name = (first || accountName || "").trim();
  if (!name) return "?";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatAccounts(s: UploadJobSummaryV1 | null, accountName: string) {
  const rows = s?.accounts;
  if (!rows?.length) return accountName;
  if (rows.length <= 2) return rows.map((a) => a.name).join(", ");
  return `${rows[0].name}, ${rows[1].name} +${rows.length - 2}`;
}

function formatAccountsFull(s: UploadJobSummaryV1 | null, accountName: string) {
  const rows = s?.accounts;
  if (rows?.length) return rows.map((a) => a.name).join(", ");
  const trimmed = accountName.trim();
  return trimmed.length > 0 ? trimmed : "—";
}

function creativeLine(s: UploadJobSummaryV1 | null) {
  if (!s?.creativeCount && !s?.creativeNames?.length) return "—";
  const names = s.creativeNames ?? [];
  const extra = s.creativeNamesExtra ?? 0;
  if (names.length === 0) return `${s.creativeCount ?? 0} criativo(s)`;
  const tail = extra > 0 ? ` +${extra}` : "";
  return `${names.join(", ")}${tail}`;
}

function formatDateRange(startedAt: string, finishedAt: string | null) {
  const start = new Date(startedAt);
  const y = format(start, "yyyy", { locale: ptBR });
  if (!finishedAt) {
    return `${format(start, "d MMM", { locale: ptBR })} ${y} — em curso`;
  }
  const end = new Date(finishedAt);
  const yEnd = format(end, "yyyy", { locale: ptBR });
  if (y === yEnd) {
    return `${format(start, "d MMM", { locale: ptBR })} – ${format(end, "d MMM yyyy", { locale: ptBR })}`;
  }
  return `${format(start, "d MMM yyyy", { locale: ptBR })} – ${format(end, "d MMM yyyy", { locale: ptBR })}`;
}

function valueColumnText(
  s: UploadJobSummaryV1 | null,
  job: Pick<UploadJobListRow, "status" | "total" | "done">
) {
  if (s?.budget != null) {
    return formatBrl(s.budget);
  }
  if (job.total > 0 && (job.status === "processing" || job.status === "awaiting_creatives")) {
    const pct = Math.round((job.done / job.total) * 100);
    return `${pct}%`;
  }
  if (job.total > 0) {
    return `${job.done}/${job.total}`;
  }
  return "—";
}

function UploadJobErrorBlock({
  details,
  status,
}: {
  details: UploadJobErrorDetailsV1;
  status: string;
}) {
  const isFullError = status === "error";
  const title = isFullError ? "Erro no upload" : "Falhas parciais no upload";
  const boxClass = isFullError
    ? "border-red-200 bg-red-50/80 text-red-900"
    : "border-amber-200 bg-amber-50/80 text-amber-900";
  const mutedClass = isFullError ? "text-red-700" : "text-amber-800";

  return (
    <div className={`rounded-xl border p-4 ${boxClass}`}>
      <p className="font-ui text-sm font-semibold">{title}</p>
      <p className="mt-1 whitespace-pre-wrap font-ui text-sm">{details.message}</p>
      {details.items?.length ? (
        <ul className="mt-3 space-y-2">
          {details.items.map((item, index) => (
            <li key={`${item.accountName}-${item.creativeName}-${index}`} className="font-ui text-xs">
              <span className="font-semibold text-neutral-black">
                {item.accountName} · {item.creativeName}
              </span>
              <span className={`mt-0.5 block whitespace-pre-wrap ${mutedClass}`}>{item.error}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {details.warnings?.length ? (
        <div className={`mt-3 space-y-1 font-ui text-xs ${mutedClass}`}>
          {details.warnings.map((warning, index) => (
            <p key={`${warning}-${index}`} className="whitespace-pre-wrap">
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const DESKTOP_GRID =
  "hidden md:grid md:grid-cols-[minmax(0,7.5rem)_minmax(0,1.35fr)_minmax(0,1.1fr)_minmax(0,9.5rem)_minmax(0,5.5rem)_minmax(0,6.5rem)_minmax(0,1fr)_2.5rem] md:items-center md:gap-x-4 md:gap-y-1 md:px-5 md:py-4";

const HEADER_GRID =
  "hidden md:grid md:grid-cols-[minmax(0,7.5rem)_minmax(0,1.35fr)_minmax(0,1.1fr)_minmax(0,9.5rem)_minmax(0,5.5rem)_minmax(0,6.5rem)_minmax(0,1fr)_2.5rem] md:items-center md:gap-x-4 md:gap-y-0 md:rounded-t-xl md:border-b md:border-dashboard-border md:bg-dashboard-base md:px-5 md:py-3 md:font-ui md:text-xs md:font-semibold md:uppercase md:tracking-wider md:text-dashboard-muted";

export function UploadJobsList({
  jobs,
  variant = "default",
  className,
}: {
  jobs: UploadJobListRow[];
  variant?: "default" | "recent";
  className?: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (jobs.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-surface shadow-sm",
          variant === "recent" && "rounded-lg border-0 bg-dashboard-surface shadow-none",
          className
        )}
      >
        <div className={cn(variant === "recent" ? "hidden" : HEADER_GRID)}>
          <span>Envio</span>
          <span>Conta</span>
          <span>Criativos</span>
          <span>Datas</span>
          <span>Orç. / prog.</span>
          <span>Estado</span>
          <span>Campanha</span>
          <span className="sr-only">Acções</span>
        </div>

        <ul className="divide-y divide-dashboard-border">
        {jobs.map((job) => {
          const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;
          const s = job.summary;
          const expanded = expandedId === job.id;
          const title = s?.nomenclaturePreview?.trim() || "Upload";
          const accounts = formatAccounts(s, job.account_name);
          const creatives = creativeLine(s);
          const dateRange = formatDateRange(job.started_at, job.finished_at);
          const valueMain = valueColumnText(s, job);
          const detailLine = s?.objective?.trim() || s?.campaignType?.trim() || "—";
          const initials = entityInitials(job.account_name, s);
          const accountTooltip = `${title}\n\n${formatAccountsFull(s, job.account_name)}`;
          const budgetTooltip =
            s?.budget != null
              ? `${valueMain} (${budgetPeriodLabel(s.budgetPeriod)})`
              : job.total > 0
                ? `${job.done} de ${job.total}`
                : valueMain;

          const toggle = () => setExpandedId((id) => (id === job.id ? null : job.id));

          return (
            <li
              key={job.id}
              className={cn(
                "bg-dashboard-surface transition-colors duration-150",
                variant !== "recent" && "hover:bg-dashboard-base/35"
              )}
            >
              {/* Mobile row */}
              <div className="flex flex-col gap-4 p-4 md:hidden">
                <div className="flex items-start justify-between gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        className="flex min-w-0 cursor-default items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-sm",
                            statusIconTint(job.status)
                          )}
                          aria-hidden
                        >
                          #
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-medium text-neutral-black">{shortJobId(job.id)}</p>
                          <p className="mt-0.5 truncate font-mono text-[10px] text-neutral-gray">{job.id}</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <span className="font-mono text-[11px]">{job.id}</span>
                    </TooltipContent>
                  </Tooltip>
                  {statusBadge(job.status)}
                </div>

                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple-subtle text-xs font-semibold text-brand-purple"
                    aria-hidden
                  >
                    {initials}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        className="min-w-0 flex-1 cursor-default rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
                      >
                        <p className="font-ui text-sm font-semibold text-neutral-black">{title}</p>
                        <p className="mt-0.5 font-ui text-xs text-dashboard-muted">{accounts}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">{accountTooltip}</TooltipContent>
                  </Tooltip>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">Criativos</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p
                          tabIndex={0}
                          className="mt-0.5 cursor-default font-ui text-sm text-neutral-black outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
                        >
                          {creatives}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="top">{creatives}</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">Datas</p>
                      <p className="mt-0.5 font-ui text-sm text-dashboard-muted">{dateRange}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          tabIndex={0}
                          className="cursor-default rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">
                            Orç. / prog.
                          </p>
                          <p className="mt-0.5 font-ui text-sm font-semibold tabular-nums text-neutral-black">
                            {valueMain}
                          </p>
                          {s?.budget != null ? (
                            <p className="font-ui text-[11px] text-dashboard-muted">{budgetPeriodLabel(s.budgetPeriod)}</p>
                          ) : job.total > 0 ? (
                            <p className="font-ui text-[11px] text-dashboard-muted">
                              {job.done} de {job.total}
                            </p>
                          ) : null}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">{budgetTooltip}</TooltipContent>
                    </Tooltip>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">Campanha</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p
                          tabIndex={0}
                          className="mt-0.5 cursor-default font-ui text-sm text-neutral-black outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
                        >
                          {detailLine}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="top">{detailLine}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="flex justify-end border-t border-dashboard-border pt-2">
                  <button
                    type="button"
                    className={cn(
                      "rounded-lg p-2 text-neutral-gray transition-colors hover:bg-dashboard-base hover:text-neutral-black",
                      expanded && "bg-dashboard-base text-neutral-black"
                    )}
                    aria-expanded={expanded}
                    aria-label={expanded ? "Fechar detalhes" : "Ver detalhes"}
                    onClick={toggle}
                  >
                    <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              {/* Desktop row */}
              <div className={DESKTOP_GRID}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      tabIndex={0}
                      className="flex min-w-0 cursor-default items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-sm",
                          statusIconTint(job.status)
                        )}
                        aria-hidden
                      >
                        #
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-medium text-neutral-black">{shortJobId(job.id)}</p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span className="font-mono text-[11px]">{job.id}</span>
                  </TooltipContent>
                </Tooltip>

                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple-subtle text-xs font-semibold text-brand-purple"
                    aria-hidden
                  >
                    {initials}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        className="min-w-0 cursor-default rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
                      >
                        <p className="truncate font-ui text-sm font-semibold text-neutral-black">{title}</p>
                        <p className="mt-0.5 truncate font-ui text-xs text-dashboard-muted">{accounts}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">{accountTooltip}</TooltipContent>
                  </Tooltip>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <p
                      tabIndex={0}
                      className="min-w-0 cursor-default truncate font-ui text-sm leading-snug text-neutral-black outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
                    >
                      {creatives}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="top">{creatives}</TooltipContent>
                </Tooltip>

                <p className="font-ui text-sm leading-snug text-dashboard-muted">{dateRange}</p>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      tabIndex={0}
                      className="cursor-default rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
                    >
                      <p className="font-ui text-sm font-semibold tabular-nums leading-snug text-neutral-black">
                        {valueMain}
                      </p>
                      {s?.budget != null ? (
                        <p className="mt-0.5 truncate font-ui text-[11px] text-dashboard-muted">
                          {budgetPeriodLabel(s.budgetPeriod)}
                        </p>
                      ) : job.total > 0 ? (
                        <p className="mt-0.5 font-ui text-[11px] text-dashboard-muted">
                          {job.done} de {job.total}
                        </p>
                      ) : null}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">{budgetTooltip}</TooltipContent>
                </Tooltip>

                <div className="flex justify-start">{statusBadge(job.status)}</div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <p
                      tabIndex={0}
                      className="min-w-0 cursor-default truncate font-ui text-sm leading-snug text-neutral-black outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
                    >
                      {detailLine}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="top">{detailLine}</TooltipContent>
                </Tooltip>

                <div className="flex justify-center">
                  <button
                    type="button"
                    className={cn(
                      "rounded-lg p-2 text-neutral-gray transition-colors hover:bg-dashboard-base hover:text-neutral-black",
                      expanded && "bg-dashboard-base text-neutral-black"
                    )}
                    aria-expanded={expanded}
                    aria-label={expanded ? "Fechar detalhes" : "Ver detalhes"}
                    onClick={toggle}
                  >
                    <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              {(job.status === "processing" || job.status === "awaiting_creatives") &&
              job.total > 0 &&
              variant !== "recent" ? (
                <div className="border-t border-dashboard-border px-4 pb-3 pt-2 md:px-5 md:pb-3 md:pt-2">
                  <div className="md:ml-[calc(7.5rem+1.25rem)] md:mr-10">
                    <ProgressBar value={pct} className="h-1.5" />
                    <div className="mt-1.5 flex justify-between gap-2 font-ui text-[11px] text-neutral-gray">
                      <span>
                        {job.done} de {job.total} unidades
                      </span>
                      <span className="font-semibold text-brand-purple">{pct}%</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {job.status === "awaiting_creatives" && job.total === 0 && variant !== "recent" ? (
                <div className="border-t border-dashboard-border px-4 py-3 text-sm text-dashboard-muted md:px-4">
                  Operação criada; à espera que os criativos sejam enviados ao servidor.
                </div>
              ) : null}

              {expanded ? (
                <div className="border-t border-dashboard-border bg-dashboard-base px-4 py-4 md:px-6">
                  {job.error_details ? (
                    <div className="mb-4">
                      <UploadJobErrorBlock details={job.error_details} status={job.status} />
                    </div>
                  ) : null}
                  {s ? (
                    <div className="rounded-xl border border-dashboard-border bg-dashboard-surface px-4 py-1">
                      <InfoRow label="Objectivo" value={s.objective ?? "—"} />
                      <InfoRow
                        label="Orçamento"
                        value={
                          s.budget != null
                            ? `${formatBrl(s.budget)} (${budgetPeriodLabel(s.budgetPeriod)})`
                            : "—"
                        }
                      />
                      <InfoRow label="Tipo de campanha" value={s.campaignType ?? "—"} />
                      <InfoRow label="Estrutura" value={s.structureDisplay ?? s.structure ?? "—"} />
                      <InfoRow label="Público" value={s.publicoName ?? "—"} />
                      <InfoRow label="Criativos" value={creativeLine(s)} />
                      {s.pixelId ? <InfoRow label="Pixel" value={s.pixelId} /> : null}
                      <InfoRow label="Estado no Meta" value={s.campaignStatus ?? "—"} />
                      <InfoRow label="ID do envio" value={job.id} />
                    </div>
                  ) : job.status !== "awaiting_creatives" ? (
                    <p className="text-xs text-dashboard-muted">
                      Resumo indisponível para este envio (dados anteriores à actualização da plataforma).
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      </div>
    </TooltipProvider>
  );
}
