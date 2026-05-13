"use client";

import { cn } from "@/lib/utils";

export type MetaHubViewId = "contas" | "paginas";

const tabs: { id: MetaHubViewId; label: string }[] = [
  { id: "contas", label: "Contas de anúncios" },
  { id: "paginas", label: "Páginas Facebook" },
];

export function MetaHubViewTabs({
  active,
  onChange,
}: {
  active: MetaHubViewId;
  onChange: (id: MetaHubViewId) => void;
}) {
  return (
    <div
      className="mb-6 flex flex-wrap gap-1 border-b border-dashboard-border"
      role="tablist"
      aria-label="Vista Meta"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`meta-hub-tab-${tab.id}`}
            aria-controls={`meta-hub-panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative -mb-px px-4 pb-3 pt-1 text-sm font-medium transition-colors",
              selected
                ? "border-b-2 border-brand-purple font-semibold text-brand-purple"
                : "border-b-2 border-transparent text-neutral-silver hover:text-neutral-black"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
