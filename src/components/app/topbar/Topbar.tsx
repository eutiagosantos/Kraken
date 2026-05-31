"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useKrakenUser } from "@/lib/hooks/useKrakenUser";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useSidebar } from "../sidebar/SidebarContext";
import { NOTIF_LAST_SEEN_KEY, NotificationPanel } from "./NotificationPanel";

const crumbLabels: Record<string, string> = {
  home: "Home",
  upload: "Novo Upload",
  "fila-de-processamento": "Fila de processamento",
  campanhas: "Campanhas",
  contas: "Contas Meta",
  "contas-meta": "Contas Meta",
  configuracoes: "Configurações",
};

function breadcrumbsFromPath(pathname: string) {
  if (pathname === "/home" || pathname === "/")
    return ["Home", "Novo Upload"];
  const seg = pathname.replace(/^\//, "").split("/")[0];
  const label = crumbLabels[seg] ?? seg;
  return ["Home", label];
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function readLastSeen(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NOTIF_LAST_SEEN_KEY);
}

function writeLastSeen(iso: string) {
  localStorage.setItem(NOTIF_LAST_SEEN_KEY, iso);
}

export function Topbar({ pathname }: { pathname: string }) {
  const { setMobileOpen } = useSidebar();
  const { displayName, email } = useKrakenUser();
  const { notifications, isLoading } = useNotifications();
  const crumbs = breadcrumbsFromPath(pathname);
  const initials = initialsFrom(displayName);

  const [panelOpen, setPanelOpen] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setLastSeenAt(readLastSeen());
  }, []);

  const unreadCount = useMemo(() => {
    if (!notifications.length) return 0;
    const seenMs = lastSeenAt ? new Date(lastSeenAt).getTime() : 0;
    return notifications.filter((n) => new Date(n.createdAt).getTime() > seenMs).length;
  }, [notifications, lastSeenAt]);

  const markAllSeen = useCallback(() => {
    const now = new Date().toISOString();
    writeLastSeen(now);
    setLastSeenAt(now);
  }, []);

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => {
      const next = !open;
      if (next) markAllSeen();
      return next;
    });
  }, [markAllSeen]);

  return (
    <header
      className={cn(
        // md:top-[12px] must match SIDEBAR_FLOAT_INSET_PX when sticky (desktop floating sidebar)
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-dashboard-border md:top-[12px]",
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
        <div className="relative">
          <button
            ref={bellRef}
            type="button"
            className="relative rounded-lg p-2 text-neutral-gray transition-colors hover:bg-[rgba(148,151,169,0.08)] hover:text-neutral-black"
            aria-label="Notificações"
            aria-expanded={panelOpen}
            onClick={togglePanel}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-purple px-0.5 text-[10px] font-bold text-neutral-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
          <NotificationPanel
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            anchorRef={bellRef}
            notifications={notifications}
            isLoading={isLoading}
          />
        </div>
        <Badge variant="purple" className="hidden px-2 py-1 text-xs font-semibold sm:inline-flex">
          PRO
        </Badge>
        <div
          className="ml-1 hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-xs font-bold text-neutral-white sm:flex"
          title={email || displayName}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
