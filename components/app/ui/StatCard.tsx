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
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      className="flex gap-3.5 rounded-xl border border-dashboard-border bg-dashboard-surface p-5"
      style={{ borderTopColor: iconColor, borderTopWidth: 3 }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-5 w-5" style={{ color: iconColor }} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-gray">{label}</p>
        <p className="mt-0.5 font-display text-[1.625rem] font-bold leading-none tracking-tight text-neutral-black">{value}</p>
        <p
          className={cn(
            "mt-1 text-sm font-medium",
            deltaType === "positive" && "text-semantic-green",
            deltaType === "neutral" && "text-dashboard-muted",
            deltaType === "negative" && "text-semantic-red"
          )}
        >
          {delta}
        </p>
      </div>
    </div>
  );
}
