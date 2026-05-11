"use client";

import { cn } from "@/lib/utils";

export function HealthIndicator({
  color,
  pulse,
  className,
}: {
  color: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", pulse && "animate-pulse", className)}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}
