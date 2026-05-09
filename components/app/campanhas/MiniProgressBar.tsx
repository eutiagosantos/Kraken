"use client";

import { cn } from "@/lib/utils";

export function MiniProgressBar({
  value,
  total,
  className,
}: {
  value: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div
      className={cn("mt-1 h-[3px] w-full overflow-hidden rounded-full bg-dashboard-track", className)}
      aria-hidden
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-purple to-[#9b72ff]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
