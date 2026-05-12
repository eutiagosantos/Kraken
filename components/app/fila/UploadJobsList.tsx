"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { InfoRow } from "@/components/app/ui/InfoRow";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
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

function statusBadge(status: string) {
  switch (status) {
    case "processing":
      return (
        <span className="inline-flex rounded-[6px] bg-[rgba(217,119,6,0.12)] px-2.5 py-1 font-ui text-xs font-semibold text-[#b45309]">
          A processar
        </span>
      );
    case "completed":
      return (
        <Badge variant="success" className="font-ui text-xs font-semibold">
          Concluído
        </Badge>
      );
    case "error":
      return (
        <Badge variant="neutral" className="bg-semantic-red-bg font-ui text-xs font-semibold text-semantic-red">
          Erro
        </Badge>
      );
    case "awaiting_creatives":
      return (
        <span className="inline-flex rounded-[6px] bg-[rgba(104,107,130,0.14)] px-2.5 py-1 font-ui text-xs font-semibold text-[#484b5e]">
          À espera de criativos
        </span>
      );
    default:
      return (
        <span className="inline-flex rounded-[6px] bg-[rgba(104,107,130,0.14)] px-2.5 py-1 font-ui text-xs font-semibold text-[#484b5e]">
          {status}
        </span>
      );
  }
}

function formatAccounts(s: UploadJobSummaryV1 | null, accountName: string) {
  const rows = s?.accounts;
  if (!rows?.length) return accountName;
  if (rows.length <= 2) return rows.map((a) => a.name).join(", ");
  return `${rows[0].name}, ${rows[1].name} +${rows.length - 2}`;
}

function creativeLine(s: UploadJobSummaryV1 | null) {
  if (!s?.creativeCount && !s?.creativeNames?.length) return "—";
  const names = s.creativeNames ?? [];
  const extra = s.creativeNamesExtra ?? 0;
  if (names.length === 0) return `${s.creativeCount ?? 0} criativo(s)`;
  const tail = extra > 0 ? ` +${extra}` : "";
  return `${names.join(", ")}${tail}`;
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
    <div className={`mt-4 rounded-xl border p-4 ${boxClass}`}>
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

export function UploadJobsList({ jobs }: { jobs: UploadJobListRow[] }) {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-4">
      {jobs.map((job) => {
        const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;
        const started = format(new Date(job.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR });
        const finished =
          job.finished_at != null
            ? format(new Date(job.finished_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
            : null;
        const s = job.summary;

        return (
          <li
            key={job.id}
            className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-ui text-base font-semibold text-neutral-black">
                  {s?.nomenclaturePreview?.trim() || "Upload"}
                </p>
                <p className="mt-1 font-ui text-xs text-dashboard-muted">
                  {formatAccounts(s, job.account_name)} · iniciado {started}
                  {finished ? ` · concluído ${finished}` : ""}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-neutral-gray">{job.id}</p>
              </div>
              {statusBadge(job.status)}
            </div>

            {(job.status === "processing" || job.status === "awaiting_creatives") && job.total > 0 ? (
              <div className="mt-4">
                <ProgressBar value={pct} className="h-2" />
                <div className="mt-2 flex flex-wrap justify-between gap-2 font-ui text-xs text-neutral-gray">
                  <span>
                    {job.done} de {job.total} unidades
                  </span>
                  <span className="font-semibold text-brand-purple">{pct}%</span>
                </div>
              </div>
            ) : null}

            {job.status === "awaiting_creatives" && job.total === 0 ? (
              <p className="mt-3 text-sm text-dashboard-muted">
                Operação criada; à espera que os criativos sejam enviados ao servidor.
              </p>
            ) : null}

            {job.error_details ? (
              <UploadJobErrorBlock details={job.error_details} status={job.status} />
            ) : null}

            {s ? (
              <div className="mt-4 rounded-xl border border-dashboard-border bg-dashboard-base px-4">
                <InfoRow label="Objectivo" value={s.objective ?? "—"} />
                <InfoRow
                  label="Orçamento"
                  value={
                    s.budget != null
                      ? `${s.budget} € (${budgetPeriodLabel(s.budgetPeriod)})`
                      : "—"
                  }
                />
                <InfoRow label="Tipo de campanha" value={s.campaignType ?? "—"} />
                <InfoRow label="Estrutura" value={s.structureDisplay ?? s.structure ?? "—"} />
                <InfoRow label="Público" value={s.publicoName ?? "—"} />
                <InfoRow label="Criativos" value={creativeLine(s)} />
                {s.pixelId ? <InfoRow label="Pixel" value={s.pixelId} /> : null}
                <InfoRow label="Estado no Meta" value={s.campaignStatus ?? "—"} />
              </div>
            ) : job.status !== "awaiting_creatives" ? (
              <p className="mt-3 text-xs text-dashboard-muted">
                Resumo indisponível para este envio (dados anteriores à actualização da plataforma).
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
