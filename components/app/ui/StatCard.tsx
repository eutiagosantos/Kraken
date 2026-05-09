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
      className={cn(
        "flex gap-4 rounded-card border border-neutral-border bg-neutral-white p-5 shadow-subtle",
        "transition-shadow duration-200 hover:shadow-micro"
      )}
      style={{ borderTopWidth: 3, borderTopColor: iconColor }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-5 w-5" style={{ color: iconColor }} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-ui text-sm font-medium leading-snug text-neutral-silver">{label}</p>
        <p className="mt-1 font-display text-[1.625rem] font-bold leading-none tracking-[-0.02em] text-neutral-black md:text-[1.75rem]">
          {value}
        </p>
        <p
          className={cn(
            "mt-1.5 font-ui text-sm font-medium leading-normal",
            deltaType === "positive" && "text-semantic-green-dark",
            deltaType === "neutral" && "text-neutral-silver",
            deltaType === "negative" && "text-semantic-red"
          )}
        >
          {delta}
        </p>
      </div>
    </div>
  );
}
