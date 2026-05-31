"use client";

import { ChevronDown, History, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useKrakenUser } from "@/lib/hooks/useKrakenUser";
import { useSupabase } from "@/lib/hooks/useSupabase";

type Props = {
  collapsed: boolean;
};

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SidebarProfileMenu({ collapsed }: Props) {
  const router = useRouter();
  const supabase = useSupabase();
  const { displayName, email } = useKrakenUser();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

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

  const initials = initialsFrom(displayName);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await supabase.auth.signOut();
    close();
    router.push("/login");
    router.refresh();
  };

  if (collapsed) {
    return (
      <div ref={rootRef} className="relative flex justify-center pb-2">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-xs font-bold text-neutral-white ring-2 ring-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40"
        >
          {initials}
        </button>
        {open ? (
          <ProfileDropdown
            id={menuId}
            className="left-full top-0 ml-2"
            displayName={displayName}
            email={email}
            onClose={close}
            onLogout={() => void logout()}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative px-2 pb-2">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-sidebar-ghost/60 px-2 py-2 text-left transition-colors",
          "hover:bg-dashboard-sidebar-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-sm font-bold text-neutral-white ring-2 ring-brand-purple/20">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-black">{displayName}</p>
          <p className="truncate text-xs text-dashboard-muted">{email || "—"}</p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-dashboard-muted transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <ProfileDropdown
          id={menuId}
          className="left-2 right-2 bottom-full mb-1"
          displayName={displayName}
          email={email}
          onClose={close}
          onLogout={() => void logout()}
        />
      ) : null}
    </div>
  );
}

function ProfileDropdown({
  id,
  className,
  displayName,
  email,
  onClose,
  onLogout,
}: {
  id: string;
  className?: string;
  displayName: string;
  email: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <div
      id={id}
      role="menu"
      className={cn(
        "absolute z-50 min-w-[200px] rounded-xl border border-dashboard-border bg-dashboard-surface p-1 shadow-sidebar",
        className
      )}
    >
      <div className="border-b border-dashboard-border px-3 py-2">
        <p className="text-sm font-semibold text-neutral-black">{displayName}</p>
        <p className="truncate text-xs text-dashboard-muted">{email || "—"}</p>
      </div>
      <Link
        href="/privacidade"
        role="menuitem"
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-neutral-black hover:bg-dashboard-sidebar-ghost"
        onClick={onClose}
      >
        <ShieldCheck className="h-4 w-4 text-dashboard-muted" aria-hidden />
        Política e privacidade
      </Link>
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-neutral-black hover:bg-dashboard-sidebar-ghost"
        onClick={onClose}
      >
        <History className="h-4 w-4 text-dashboard-muted" aria-hidden />
        Histórico
      </button>
      <div className="my-1 h-px bg-dashboard-border" />
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-semantic-red hover:bg-semantic-red-bg"
        onClick={() => {
          onLogout();
        }}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sair
      </button>
    </div>
  );
}
