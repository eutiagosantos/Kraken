"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  shortcut,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  shortcut?: string;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={cn(
        "group/navitem relative",
        collapsed && "flex justify-center"
      )}
    >
      <Link
        href={href}
        aria-label={collapsed ? label : undefined}
        onClick={onNavigate}
        className={cn(
          "relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/30",
          collapsed ? "w-11 justify-center px-0" : "px-3",
          active
            ? "bg-brand-purple-subtle text-brand-purple"
            : "text-neutral-gray hover:bg-dashboard-sidebar-ghost hover:text-neutral-black"
        )}
      >
        <Icon
          className={cn("h-[22px] w-[22px] shrink-0", active ? "text-brand-purple" : "text-neutral-gray")}
          aria-hidden
        />
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {shortcut ? (
              <span className="shrink-0 tabular-nums text-xs font-normal text-dashboard-muted">{shortcut}</span>
            ) : null}
          </>
        ) : null}
      </Link>
      {collapsed ? (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5",
            "bg-neutral-black text-xs font-medium text-neutral-white opacity-0 shadow-md transition-opacity duration-150",
            "group-hover/navitem:opacity-100 group-focus-within/navitem:opacity-100"
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
