import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  description?: string;
  panelEyebrow?: string;
  panelTitle: string;
  panelSubtitle: string;
  children: ReactNode;
  className?: string;
};

export function AuthShell({
  title,
  description,
  panelEyebrow = "Kraken",
  panelTitle,
  panelSubtitle,
  children,
  className,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-6xl flex-1 gap-0 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-8 lg:py-10",
        className
      )}
    >
      <aside className="relative hidden overflow-hidden rounded-card lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="hero-dark bg-grid-dark absolute inset-0 rounded-card" />
        <div className="relative z-[1] flex flex-col gap-6">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">
            {panelEyebrow}
          </p>
          <h2 className="font-display text-display-md text-neutral-white text-balance">
            {panelTitle}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-neutral-silver">
            {panelSubtitle}
          </p>
        </div>
        <p className="relative z-[1] text-xs text-neutral-silver/80">
          Upload em massa para Meta Ads com segurança e escala.
        </p>
      </aside>

      <div className="flex flex-col justify-center px-4 pb-12 pt-6 sm:px-6 lg:px-2 lg:py-0">
        <div className="mb-6 lg:hidden">
          <div className="relative overflow-hidden rounded-card border border-neutral-border p-6 shadow-subtle">
            <div className="hero-dark bg-grid-dark absolute inset-0 opacity-95" />
            <div className="relative z-[1] space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">
                {panelEyebrow}
              </p>
              <p className="font-display text-xl font-bold text-neutral-white">
                {panelTitle}
              </p>
              <p className="text-sm leading-relaxed text-neutral-silver">
                {panelSubtitle}
              </p>
            </div>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-md border-neutral-border p-6 shadow-card sm:p-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-black sm:text-display-md">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-neutral-gray">
                {description}
              </p>
            ) : null}
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
}
