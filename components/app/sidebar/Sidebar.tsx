"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Search,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { mockWorkspaces } from "@/lib/mock-data";
import { SidebarItem } from "./SidebarItem";
import { useSidebar } from "./SidebarContext";
import { SidebarProfileMenu } from "./SidebarProfileMenu";
import {
  SIDEBAR_FLOAT_INSET_PX,
  SIDEBAR_WIDTH_COLLAPSED_PX,
  SIDEBAR_WIDTH_EXPANDED_PX,
} from "./sidebar-layout";
import { SidebarWorkspaceMenu } from "./SidebarWorkspaceMenu";

const mainNav = [
  { href: "/home", label: "Home", icon: LayoutDashboard, shortcut: "⌘1" },
  { href: "/upload", label: "Novo Upload", icon: Upload, shortcut: "⌘2" },
  { href: "/campanhas", label: "Campanhas", icon: Layers, shortcut: "⌘3" },
  { href: "/contas-meta", label: "Contas Meta", icon: Users, shortcut: "⌘4" },
  { href: "/relatorios", label: "Relatórios", icon: BarChart2, shortcut: "⌘5" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen, ready } = useSidebar();
  const [searchMod, setSearchMod] = useState("⌘");

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setSearchMod(/Mac|iPhone|iPod/i.test(navigator.platform) ? "⌘" : "Ctrl+");
  }, []);

  const widthExpanded = SIDEBAR_WIDTH_EXPANDED_PX;
  const widthCollapsed = SIDEBAR_WIDTH_COLLAPSED_PX;

  return (
    <>
      <motion.aside
        initial={false}
        animate={{
          width: ready ? (collapsed ? widthCollapsed : widthExpanded) : widthExpanded,
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }}
        style={{
          left: SIDEBAR_FLOAT_INSET_PX,
          top: SIDEBAR_FLOAT_INSET_PX,
          height: `calc(100vh - ${SIDEBAR_FLOAT_INSET_PX * 2}px)`,
        }}
        className={cn(
          "fixed z-40 hidden min-h-0 flex-col rounded-2xl border border-dashboard-border",
          "bg-dashboard-surface shadow-sidebar md:flex"
        )}
      >
        <SidebarWorkspaceMenu workspaces={mockWorkspaces} collapsed={collapsed} />

        {!collapsed ? (
          <div className="shrink-0 px-3 pb-2 pt-1">
            <label htmlFor="sidebar-dashboard-search" className="sr-only">
              Buscar
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-muted"
                aria-hidden
              />
              <input
                id="sidebar-dashboard-search"
                type="search"
                placeholder="Buscar campanhas, contas..."
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-base py-2 pl-9 pr-14 text-sm text-neutral-black outline-none transition-[border-color,box-shadow] placeholder:text-dashboard-muted focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/15"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md border border-dashboard-border bg-neutral-white px-1.5 py-0.5 font-ui text-[10px] font-medium text-dashboard-muted sm:inline-block">
                {searchMod}K
              </kbd>
            </div>
          </div>
        ) : null}

        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3" aria-label="Principal">
          {!collapsed ? (
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted">
              Navegação
            </p>
          ) : null}
          {mainNav.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              shortcut={collapsed ? undefined : item.shortcut}
              active={pathname === item.href || (item.href === "/home" && pathname === "/")}
            />
          ))}
        </nav>

        <div className="mt-auto shrink-0 border-t border-dashboard-border px-2 pb-2 pt-2">
          {!collapsed ? (
            <div className="mb-2 flex gap-1 px-1">
              <Link
                href="/configuracoes"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-neutral-gray transition-colors hover:bg-dashboard-sidebar-ghost hover:text-neutral-black"
              >
                <Settings className="h-4 w-4 shrink-0" aria-hidden />
                Configurações
              </Link>
              <a
                href="#ajuda"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-neutral-gray transition-colors hover:bg-dashboard-sidebar-ghost hover:text-neutral-black"
              >
                <HelpCircle className="h-4 w-4 shrink-0" aria-hidden />
                Ajuda
              </a>
            </div>
          ) : (
            <div className="mb-2 flex flex-col items-center gap-1">
              <Link
                href="/configuracoes"
                title="Configurações"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-gray transition-colors hover:bg-dashboard-sidebar-ghost hover:text-neutral-black"
              >
                <Settings className="h-[22px] w-[22px]" aria-hidden />
              </Link>
              <a
                href="#ajuda"
                title="Ajuda"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-gray transition-colors hover:bg-dashboard-sidebar-ghost hover:text-neutral-black"
              >
                <HelpCircle className="h-[22px] w-[22px]" aria-hidden />
              </a>
            </div>
          )}

          <SidebarProfileMenu collapsed={collapsed} />

          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-dashboard-muted transition-colors hover:bg-dashboard-sidebar-ghost hover:text-neutral-black",
              collapsed ? "px-0" : "px-2"
            )}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" aria-hidden />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
                Recolher
              </>
            )}
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-neutral-black/40 md:hidden"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] as const }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[78vh] rounded-t-2xl border border-dashboard-border bg-dashboard-surface p-4 pb-8 shadow-sidebar md:hidden"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-dashboard-border" />
              <SidebarWorkspaceMenu workspaces={mockWorkspaces} collapsed={false} />
              <div className="mt-3 px-1">
                <label htmlFor="sidebar-dashboard-search-mobile" className="sr-only">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-muted" />
                  <input
                    id="sidebar-dashboard-search-mobile"
                    type="search"
                    placeholder="Buscar campanhas, contas..."
                    className="w-full rounded-xl border border-dashboard-border bg-dashboard-base py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/15"
                  />
                </div>
              </div>
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Navegação
              </p>
              <nav className="flex max-h-[40vh] flex-col gap-1 overflow-y-auto">
                {mainNav.map((item) => (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    collapsed={false}
                    shortcut={item.shortcut}
                    active={pathname === item.href || (item.href === "/home" && pathname === "/")}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
                <SidebarItem
                  href="/configuracoes"
                  label="Configurações"
                  icon={Settings}
                  collapsed={false}
                  active={pathname === "/configuracoes"}
                  onNavigate={() => setMobileOpen(false)}
                />
              </nav>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
