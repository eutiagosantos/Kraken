"use client";

import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  current,
  total,
  showLabel,
  className,
  barClassName,
}: {
  /** 0–100 when `current`/`total` omitted */
  value?: number;
  current?: number;
  total?: number;
  showLabel?: boolean;
  className?: string;
  barClassName?: string;
}) {
  const pct =
    current != null && total != null && total > 0
      ? Math.min(100, Math.max(0, (current / total) * 100))
      : Math.min(100, Math.max(0, value ?? 0));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && current != null && total != null ? (
        <p className="mb-1 text-xs font-medium text-neutral-gray">
          {current} de {total} anúncios criados
        </p>
      ) : null}
      <div
        className={cn("h-1.5 w-full overflow-hidden rounded-full bg-dashboard-track")}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full bg-brand-purple transition-[width] duration-500 ease-out",
            barClassName
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
