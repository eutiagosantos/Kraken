"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CampanhaTabId } from "@/lib/mock-campanhas";

export function StatusTabs({
  activeTab,
  onChange,
  counts,
  children,
}: {
  activeTab: CampanhaTabId;
  onChange: (id: CampanhaTabId) => void;
  counts: Record<CampanhaTabId, number>;
  children: React.ReactNode;
}) {
  const tabs: { id: CampanhaTabId; label: string; color: string }[] = [
    { id: "ativas", label: "Ativas", color: "#7132f5" },
    { id: "concluidas", label: "Concluídas", color: "#149e61" },
    { id: "erro", label: "Com Erro", color: "#e53e3e" },
  ];

  return (
    <div>
      <div className="flex gap-6 border-b border-dashboard-border" role="tablist">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors",
                active ? "font-semibold text-brand-purple" : "border-transparent text-neutral-silver hover:text-neutral-black"
              )}
              style={
                active
                  ? { borderBottom: `2px solid ${tab.color}` }
                  : { borderBottom: "2px solid transparent" }
              }
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  active ? "bg-[rgba(113,50,245,0.12)] text-brand-purple" : "bg-[rgba(104,107,130,0.10)] text-[#686b82]"
                )}
              >
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="pt-4"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
