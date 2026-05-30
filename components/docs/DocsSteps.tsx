import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DocsStepsProps = {
  children: ReactNode;
  className?: string;
};

export function DocsSteps({ children, className }: DocsStepsProps) {
  return <ol className={cn("relative space-y-0", className)}>{children}</ol>;
}

type DocsStepProps = {
  step: number;
  title: string;
  children: ReactNode;
  isLast?: boolean;
};

export function DocsStep({ step, title, children, isLast = false }: DocsStepProps) {
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast ? (
        <span
          className="absolute left-4 top-9 h-[calc(100%-0.5rem)] w-px bg-neutral-border"
          aria-hidden
        />
      ) : null}
      <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-purple/20 bg-brand-purple-subtle text-sm font-semibold text-brand-purple">
        {step}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-2 text-sm font-semibold text-neutral-black">{title}</p>
        <div className="text-sm leading-relaxed text-neutral-gray">{children}</div>
      </div>
    </li>
  );
}
