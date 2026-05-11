"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  Settings,
  Unplug,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/lib/hooks/useClickOutside";
import type { ContaMeta } from "@/lib/mock-contas";

const MENU_MIN_WIDTH = 220;
const MENU_GAP = 4;

type MenuAction =
  | { type: "item"; label: string; icon: React.ReactNode; onClick: () => void; hidden?: boolean; destructive?: boolean }
  | { type: "divider" };

export function ContaActionsMenu({
  conta,
  onOpenMetrics,
  onEdit,
  onReconnect,
  onOpenMeta,
  onDisconnect,
}: {
  conta: ContaMeta;
  onOpenMetrics: () => void;
  onEdit: () => void;
  onReconnect: () => void;
  onOpenMeta: () => void;
  onDisconnect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    right: number;
    maxHeight: number;
    flipUp: boolean;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close, open, [menuRef]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const updateMenuPosition = useCallback(() => {
    const trigger = rootRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const preferHeight = 320;
    const flipUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      120,
      flipUp ? Math.min(preferHeight, spaceAbove) : Math.min(preferHeight, spaceBelow)
    );
    const top = flipUp ? Math.max(MENU_GAP, rect.top - maxHeight - MENU_GAP) : rect.bottom + MENU_GAP;
    setMenuStyle({
      top,
      right: vw - rect.right,
      maxHeight,
      flipUp,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [open, updateMenuPosition]);

  const raw: MenuAction[] = [
    { type: "item", label: "Ver Métricas", icon: <BarChart2 className="h-4 w-4" />, onClick: onOpenMetrics },
    {
      type: "item",
      label: "Editar Configurações",
      icon: <Settings className="h-4 w-4" />,
      onClick: onEdit,
    },
    { type: "divider" },
    {
      type: "item",
      label: "Reconectar",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: onReconnect,
      hidden: conta.status === "ativa",
    },
    {
      type: "item",
      label: "Abrir no Meta Ads",
      icon: <ExternalLink className="h-4 w-4" />,
      onClick: onOpenMeta,
    },
    { type: "divider" },
    {
      type: "item",
      label: "Desconectar Conta",
      icon: <Unplug className="h-4 w-4" />,
      onClick: onDisconnect,
      destructive: true,
    },
  ];

  const visible: MenuAction[] = [];
  for (const it of raw) {
    if (it.type === "item" && it.hidden) continue;
    if (it.type === "divider" && visible.length > 0 && visible[visible.length - 1].type === "divider") continue;
    visible.push(it);
  }
  while (visible.length && visible[0].type === "divider") visible.shift();
  while (visible.length && visible[visible.length - 1].type === "divider") visible.pop();

  return (
    <div className="relative" ref={rootRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="rounded-lg p-2 text-neutral-gray transition-colors hover:bg-[rgba(113,50,245,0.08)] hover:text-brand-purple"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Ações da conta"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {mounted
        ? createPortal(
            <AnimatePresence
              onExitComplete={() => {
                if (!openRef.current) setMenuStyle(null);
              }}
            >
              {open && menuStyle ? (
                <motion.div
                  key="conta-actions-menu"
                  ref={menuRef}
                  role="menu"
                  initial={{ opacity: 0, scale: 0.96, y: menuStyle.flipUp ? 6 : -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: menuStyle.flipUp ? 4 : -4 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "fixed",
                    top: menuStyle.top,
                    right: menuStyle.right,
                    minWidth: MENU_MIN_WIDTH,
                    maxHeight: menuStyle.maxHeight,
                    zIndex: 200,
                  }}
                  className="overflow-y-auto overscroll-contain rounded-[10px] border border-dashboard-border bg-neutral-white p-1.5 shadow-[0px_8px_24px_rgba(0,0,0,0.10)]"
                >
                  {visible.map((it, i) =>
                    it.type === "divider" ? (
                      <div key={`d-${i}`} className="my-1 h-px bg-dashboard-border" />
                    ) : (
                      <button
                        key={it.label}
                        type="button"
                        role="menuitem"
                        className={
                          it.destructive
                            ? "flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-left text-sm font-medium text-semantic-red hover:bg-[rgba(229,62,62,0.06)]"
                            : "flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-left text-sm font-medium text-neutral-black hover:bg-[#f7f7fb]"
                        }
                        onClick={() => {
                          it.onClick();
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex h-4 w-8 shrink-0 items-center justify-center">{it.icon}</span>
                        {it.label}
                      </button>
                    )
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  );
}
