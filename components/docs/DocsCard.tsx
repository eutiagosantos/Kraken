import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DocsCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function DocsCard({ title, children, className }: DocsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-border bg-white p-4 sm:p-5",
        className
      )}
    >
      <p className="mb-2 text-sm font-semibold text-neutral-black">{title}</p>
      <div className="text-sm leading-relaxed text-neutral-gray">{children}</div>
    </div>
  );
}
