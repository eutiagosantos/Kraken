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
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors duration-200",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "rounded-l-none border-l-2 border-brand-purple bg-[rgba(113,50,245,0.18)] text-neutral-white"
          : "border-l-2 border-transparent text-[#9497a9] hover:bg-[rgba(255,255,255,0.05)] hover:text-neutral-white"
      )}
    >
      <Icon className="h-[22px] w-[22px] shrink-0 opacity-90" aria-hidden />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );
}
