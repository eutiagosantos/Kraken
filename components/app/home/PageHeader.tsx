"use client";

import { Activity } from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function PageHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-2">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-neutral-black">
            {getGreeting()}
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-semantic-green-bg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-semantic-green">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-semantic-green" />
            Operacional
          </span>
        </div>
        <p className="mt-1 text-sm text-dashboard-muted capitalize">{getFormattedDate()}</p>
      </div>

      <div className="flex items-center gap-1.5 rounded-xl border border-dashboard-border bg-dashboard-surface px-4 py-2.5 shadow-subtle">
        <Activity className="h-4 w-4 text-brand-purple" />
        <span className="text-sm text-dashboard-muted">
          <span className="font-bold text-neutral-black">12.847</span> anúncios criados esta semana
        </span>
      </div>
    </div>
  );
}
