"use client";

import { cn } from "@/lib/utils";
import type { ActivityType, MockActivity } from "@/lib/mock-data";

function dotClass(type: ActivityType) {
  switch (type) {
    case "success":
      return "bg-semantic-green";
    case "processing":
      return "bg-brand-purple";
    case "error":
      return "bg-semantic-red";
    default:
      return "bg-dashboard-muted";
  }
}

type Props = {
  activities?: MockActivity[];
};

export function ActivityFeed({ activities = [] }: Props) {
  const inner =
    activities.length === 0 ? (
      <p className="py-6 text-center text-sm text-dashboard-muted">Sem atividade recente.</p>
    ) : (
    <ul className="max-h-[min(420px,55vh)] space-y-0 overflow-y-auto xl:max-h-[520px]">
      {activities.map((a, i) => (
        <li
          key={a.id ?? `${a.message}-${i}`}
          className={cn(
            "flex gap-3 py-3",
            i > 0 && "border-t border-dashboard-border"
          )}
        >
          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotClass(a.type))} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug text-neutral-black">{a.message}</p>
            <p className="mt-0.5 text-xs font-semibold text-brand-purple-dark">{a.account}</p>
            <p className="mt-1 text-xs text-dashboard-muted">{a.time}</p>
          </div>
        </li>
      ))}
    </ul>
    );

  return (
    <>
      <details className="rounded-card border border-dashboard-border bg-dashboard-surface shadow-subtle xl:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 font-display text-base font-bold text-neutral-black [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            Atividade recente
            <span className="text-xs font-semibold text-brand-purple">expandir</span>
          </span>
        </summary>
        <div className="border-t border-dashboard-border px-4 pb-4">{inner}</div>
      </details>

      <section className="hidden rounded-card border border-dashboard-border bg-dashboard-surface p-5 shadow-subtle xl:block">
        <h3 className="font-display text-lg font-bold text-neutral-black">Atividade recente</h3>
        <div className="mt-3">{inner}</div>
      </section>
    </>
  );
}
