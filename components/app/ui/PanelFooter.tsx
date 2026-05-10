import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PanelFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 mt-auto flex flex-wrap gap-2 border-t border-dashboard-border bg-neutral-white p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
