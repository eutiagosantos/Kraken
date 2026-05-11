"use client";

import { Check, ChevronDown, GripVertical } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { KrakenMarkTile } from "@/components/branding/KrakenMarkTile";
import { cn } from "@/lib/utils";
import type { MockWorkspace } from "@/lib/mock-data";

type Props = {
  workspaces: MockWorkspace[];
  collapsed: boolean;
};

export function SidebarWorkspaceMenu({ workspaces, collapsed }: Props) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(workspaces[0]?.id ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(t)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  if (!active) return null;

  return (
    <div ref={rootRef} className="relative shrink-0 px-2 pt-3">
      <button
        type="button"
        title={collapsed ? `${active.name} — ${active.plan}` : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-transparent px-2 py-2 text-left transition-colors",
          "hover:border-dashboard-border hover:bg-dashboard-sidebar-ghost",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25",
          collapsed && "justify-center px-0"
        )}
      >
        <KrakenMarkTile size="sidebar" className="shrink-0" />
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-sm font-semibold text-neutral-black">
                {active.name}
              </span>
              <span className="block truncate text-xs text-dashboard-muted">{active.plan}</span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-dashboard-muted transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </>
        ) : null}
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Workspaces"
          className={cn(
            "absolute z-50 min-w-[240px] rounded-xl border border-dashboard-border bg-dashboard-surface p-1.5 shadow-sidebar",
            collapsed ? "left-full top-0 ml-2" : "left-2 right-2 top-full mt-1"
          )}
        >
          {workspaces.map((w) => {
            const isActive = w.id === activeId;
            return (
              <button
                key={w.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setActiveId(w.id);
                  close();
                }}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                  isActive ? "bg-brand-purple-subtle text-brand-purple" : "text-neutral-black hover:bg-dashboard-sidebar-ghost"
                )}
              >
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="truncate">{w.name}</span>
                    {isActive ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-dashboard-muted">
                    {w.plan}
                    {w.membersLabel ? ` · ${w.membersLabel}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
