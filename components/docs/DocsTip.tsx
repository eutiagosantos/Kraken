import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type DocsTipProps = {
  children: ReactNode;
  className?: string;
};

export function DocsTip({ children, className }: DocsTipProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-brand-purple/15 border-l-4 border-l-brand-purple bg-brand-purple-subtle/40 px-4 py-3.5 text-sm leading-relaxed text-neutral-gray",
        className
      )}
    >
      <Lightbulb
        className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple"
        aria-hidden
      />
      <div className="min-w-0 [&_strong]:font-semibold [&_strong]:text-neutral-black">
        {children}
      </div>
    </div>
  );
}
