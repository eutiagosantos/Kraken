"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mockUser } from "@/lib/mock-data";
import { SidebarItem } from "./SidebarItem";
import { useSidebar } from "./SidebarContext";

const nav = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/upload", label: "Novo Upload", icon: Upload },
  { href: "/campanhas", label: "Campanhas", icon: Layers },
  { href: "/contas", label: "Contas Meta", icon: Users },
  { href: "/relatorios", label: "Relatórios", icon: BarChart2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen, ready } = useSidebar();

  const widthExpanded = 240;
  const widthCollapsed = 64;

  return (
    <>
      <motion.aside
        initial={false}
        animate={{
          width: ready ? (collapsed ? widthCollapsed : widthExpanded) : widthExpanded,
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#101114] md:flex",
          "transition-[width] duration-300 ease-in-out"
        )}
      >
        <div className="flex shrink-0 flex-col border-b border-[rgba(255,255,255,0.06)] px-3 py-4">
          <Link href="/home" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple">
              <Megaphone className="h-5 w-5 text-neutral-white" aria-hidden />
            </span>
            {!collapsed ? (
              <span className="font-display text-lg font-bold tracking-tight text-neutral-white">
                DirectAds
              </span>
            ) : null}
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-4">
          {nav.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              active={pathname === item.href || (item.href === "/home" && pathname === "/")}
            />
          ))}
        </nav>

        <div className="mt-auto shrink-0 border-t border-[rgba(255,255,255,0.06)] px-2 py-3">
          {!collapsed ? (
            <div className="mb-3 flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-sm font-bold text-neutral-white ring-2 ring-brand-purple/40">
                {mockUser.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-white">{mockUser.name}</p>
                <p className="truncate text-xs text-[#9497a9]">{mockUser.email}</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-[#9497a9] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-neutral-white"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mb-3 flex justify-center">
              <button
                type="button"
                title={mockUser.name}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-xs font-bold text-neutral-white ring-2 ring-brand-purple/40"
              >
                {mockUser.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg py-2 text-[#9497a9] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-neutral-white",
              collapsed ? "px-0" : "px-2"
            )}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" />
                <span className="text-xs font-medium">Recolher</span>
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
              className="fixed inset-0 z-40 bg-neutral-black/60 md:hidden"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[72vh] rounded-t-2xl border border-dashboard-border bg-[#101114] p-4 pb-8 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] md:hidden"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[rgba(255,255,255,0.15)]" />
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9497a9]">
                Navegação
              </p>
              <nav className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto">
                {nav.map((item) => (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    collapsed={false}
                    active={pathname === item.href}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </nav>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
