"use client";

import { cn } from "@/lib/utils";
import type { StatDeltaType } from "@/lib/mock-data";

export function StatCard({
  label,
  value,
  delta,
  deltaType,
  iconColor,
}: {
  label: string;
  value: string;
  delta: string;
  deltaType: StatDeltaType;
  iconColor: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-neutral-border shadow-subtle",
        "bg-gradient-to-br from-neutral-white from-35% to-dashboard-sidebar-ghost",
        "transition-shadow duration-200 hover:shadow-card",
        "p-5"
      )}
      style={{ borderTopWidth: 3, borderTopColor: iconColor }}
    >
      <div className="min-w-0">
        <p className="font-ui text-xs font-medium uppercase tracking-wide text-neutral-gray">{label}</p>
        <p className="mt-1.5 font-display text-[1.625rem] font-bold tabular-nums leading-none tracking-[-0.02em] text-neutral-black md:text-[1.75rem]">
          {value}
        </p>
        <p
          className={cn(
            "mt-1.5 font-ui text-xs font-medium leading-normal",
            deltaType === "positive" && "text-semantic-green-dark",
            deltaType === "neutral" && "text-neutral-gray",
            deltaType === "negative" && "text-semantic-red"
          )}
        >
          {delta}
        </p>
      </div>
    </div>
  );
}
