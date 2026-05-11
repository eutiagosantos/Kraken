"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import { mockActiveUploads } from "@/lib/mock-data";
function statusBadge(status: (typeof mockActiveUploads)[number]["status"]) {
  switch (status) {
    case "processing":
      return (
        <span className="inline-flex rounded-[6px] bg-[rgba(217,119,6,0.12)] px-2.5 py-1 font-ui text-xs font-semibold text-[#b45309]">
          Processando
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
    default:
      return null;
  }
}

export function CampaignProgress() {
  return (
    <section className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
      <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-neutral-black">Campanhas em andamento</h3>
      <p className="mt-1 font-ui text-sm text-neutral-silver">Acompanhe uploads e publicações em tempo real</p>
      <ul className="mt-5 space-y-4">
        {mockActiveUploads.map((job) => {
          const pct = job.total ? Math.round((job.done / job.total) * 100) : 0;
          return (
            <li
              key={job.id}
              className="rounded-[12px] border border-neutral-border bg-[rgba(148,151,169,0.08)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-ui text-base font-semibold text-neutral-black">{job.account}</p>
                  <p className="mt-0.5 font-ui text-xs text-neutral-silver">
                    {job.id} · iniciado às {job.startedAt}
                  </p>
                </div>
                {statusBadge(job.status)}
              </div>
              <div className="mt-4">
                <ProgressBar value={pct} className="h-2" />
                <div className="mt-2 flex flex-wrap justify-between gap-2 font-ui text-xs text-neutral-gray">
                  <span>
                    {job.done} de {job.total} campanhas
                  </span>
                  <span className="font-semibold text-brand-purple">{pct}%</span>
                </div>
              </div>
              <Link
                href="/campanhas"
                className="mt-3 inline-flex font-ui text-sm font-semibold text-brand-purple transition-colors hover:text-brand-purple-dark"
              >
                Ver detalhes
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
