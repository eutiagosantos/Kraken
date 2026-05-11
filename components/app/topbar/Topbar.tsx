"use client";

import { Bell, Menu, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { mockUser } from "@/lib/mock-data";
import { useSidebar } from "../sidebar/SidebarContext";

const crumbLabels: Record<string, string> = {
  home: "Home",
  upload: "Novo Upload",
  campanhas: "Campanhas",
  contas: "Contas Meta",
  "contas-meta": "Contas Meta",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};

function breadcrumbsFromPath(pathname: string) {
  if (pathname === "/home" || pathname === "/")
    return ["Home", "Novo Upload"];
  const seg = pathname.replace(/^\//, "").split("/")[0];
  const label = crumbLabels[seg] ?? seg;
  return ["Home", label];
}

export function Topbar({ pathname }: { pathname: string }) {
  const { setMobileOpen } = useSidebar();
  const crumbs = breadcrumbsFromPath(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-dashboard-border",
        "bg-dashboard-surface px-4 shadow-[rgba(0,0,0,0.03)_0px_1px_4px] md:px-6"
      )}
    >
      <button
        type="button"
        className="rounded-lg p-2 text-neutral-black hover:bg-[rgba(148,151,169,0.08)] md:hidden"
        aria-label="Abrir menu"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav className="hidden min-w-0 text-sm font-medium text-neutral-gray sm:block" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2">
          {crumbs.map((c, i) => (
            <li key={`${c}-${i}`} className="flex items-center gap-2">
              {i > 0 ? <span className="text-dashboard-muted">/</span> : null}
              <span className={cn(i === crumbs.length - 1 ? "font-semibold text-neutral-black" : "")}>
                {c}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="relative mx-auto max-w-md flex-1 md:hidden">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-muted" />
        <input
          type="search"
          placeholder="Buscar campanhas, contas..."
          className="w-full rounded-lg border border-dashboard-border bg-[#f7f7fb] py-2 pl-9 pr-3 text-sm text-neutral-black outline-none transition-[border-color,box-shadow] placeholder:text-dashboard-muted focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
          aria-label="Buscar"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="relative rounded-lg p-2 text-neutral-gray transition-colors hover:bg-[rgba(148,151,169,0.08)] hover:text-neutral-black"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-purple px-0.5 text-[10px] font-bold text-neutral-white">
            3
          </span>
        </button>
        <Badge variant="purple" className="hidden px-2 py-1 text-xs font-semibold sm:inline-flex">
          PRO
        </Badge>
        <div
          className="ml-1 hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-xs font-bold text-neutral-white sm:flex"
          title={mockUser.email}
        >
          {mockUser.name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
      </div>
    </header>
  );
}
