"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import { mockActiveUploads } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function statusBadge(status: (typeof mockActiveUploads)[number]["status"]) {
  switch (status) {
    case "processing":
      return (
        <Badge variant="neutral" className="bg-semantic-yellow-bg font-semibold text-semantic-yellow">
          Processando
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="success" className="font-semibold">
          Concluído
        </Badge>
      );
    case "error":
      return (
        <Badge variant="neutral" className="bg-semantic-red-bg font-semibold text-semantic-red">
          Erro
        </Badge>
      );
    default:
      return null;
  }
}

export function CampaignProgress() {
  return (
    <section className="rounded-card border border-dashboard-border bg-dashboard-surface p-5 shadow-subtle">
      <h3 className="font-display text-lg font-bold text-neutral-black">Campanhas em andamento</h3>
      <ul className="mt-4 space-y-5">
        {mockActiveUploads.map((job) => {
          const pct = job.total ? Math.round((job.done / job.total) * 100) : 0;
          return (
            <li key={job.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-neutral-black">{job.account}</p>
                  <p className="text-xs text-dashboard-muted">{job.id} · iniciado às {job.startedAt}</p>
                </div>
                {statusBadge(job.status)}
              </div>
              <div className="mt-3">
                <ProgressBar value={pct} />
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-neutral-gray">
                  <span>
                    {job.done} de {job.total} campanhas
                  </span>
                  <span className="font-semibold text-brand-purple">{pct}%</span>
                </div>
              </div>
              <Link href="/campanhas" className="mt-2 inline-block text-xs font-semibold text-brand-purple hover:underline">
                Ver detalhes
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
