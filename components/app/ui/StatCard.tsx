"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatDeltaType } from "@/lib/mock-data";

export function StatCard({
  label,
  value,
  delta,
  deltaType,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  delta: string;
  deltaType: StatDeltaType;
  icon?: LucideIcon;
  iconBg: string;
  iconColor: string;
}) {
  const hasIcon = Boolean(Icon);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-neutral-border shadow-subtle",
        "bg-gradient-to-br from-neutral-white from-35% to-dashboard-sidebar-ghost",
        "transition-shadow duration-200 hover:shadow-card",
        "p-5",
        hasIcon ? "flex gap-4" : "pl-6"
      )}
      style={
        hasIcon
          ? { borderTopWidth: 3, borderTopColor: iconColor }
          : { borderTopWidth: 0, borderTopColor: "transparent" }
      }
    >
      {!hasIcon ? (
        <div
          className="absolute left-4 top-5 bottom-5 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: iconColor }}
          aria-hidden
        />
      ) : null}
      {hasIcon && Icon ? (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ring-1 ring-black/[0.04]"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} style={{ color: iconColor }} aria-hidden />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="font-ui text-xs font-medium uppercase tracking-wide text-neutral-gray">
          {label}
        </p>
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
