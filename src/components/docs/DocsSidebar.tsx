"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { KrakenMarkTile } from "@/components/branding/KrakenMarkTile";
import { MCP_DOCS_SECTIONS } from "@/libs/docs/mcp-tools-data";
import { cn } from "@/libs/utils";

type DocsSidebarProps = {
  className?: string;
};

export function DocsSidebar({ className }: DocsSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(MCP_DOCS_SECTIONS[0].id);

  useEffect(() => {
    const sectionIds = MCP_DOCS_SECTIONS.map((s) => s.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const onNavClick = useCallback((id: string) => {
    setActiveId(id);
    setMobileOpen(false);
  }, []);

  const navLinks = (
    <nav className="flex flex-col gap-0.5" aria-label="Documentação MCP">
      {MCP_DOCS_SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          onClick={() => onNavClick(section.id)}
          className={cn(
            "relative rounded-btn px-3 py-2 pl-4 text-[13px] font-normal transition-colors",
            activeId === section.id
              ? "font-medium text-brand-purple"
              : "text-neutral-gray hover:text-neutral-black"
          )}
        >
          {activeId === section.id ? (
            <span
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-purple"
              aria-hidden
            />
          ) : null}
          {section.label}
        </a>
      ))}
    </nav>
  );

  const sidebarFooter = (
    <div className="mt-auto space-y-4 border-t border-neutral-border/80 pt-6">
      <Link
        href="/configuracoes"
        className="group flex items-center justify-between rounded-lg border border-neutral-border px-3.5 py-2.5 text-[13px] font-medium text-neutral-black transition hover:border-brand-purple/30 hover:text-brand-purple"
      >
        <span>Criar chave API</span>
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
      <Link
        href="/login"
        className="block text-sm font-medium text-neutral-gray transition hover:text-brand-purple"
      >
        Entrar no Kraken
      </Link>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-border bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <KrakenMarkTile size="sm" />
          <span className="font-display text-sm font-semibold text-neutral-black">Kraken Docs</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-btn p-2 text-neutral-gray hover:bg-black/[0.04]"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-[57px] z-30 flex h-[calc(100dvh-57px)] w-64 flex-col overflow-y-auto border-r border-neutral-border bg-white px-4 py-6 transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-[100dvh] lg:overflow-hidden lg:translate-x-0 lg:shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="mb-6 hidden lg:block">
          <Link href="/" className="mb-4 flex items-center gap-2">
            <KrakenMarkTile size="sm" />
            <span className="font-display text-sm font-semibold text-neutral-black">Kraken</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-brand-purple/70">
              MCP Server
            </p>
            <span className="rounded-full border border-neutral-border bg-white px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-neutral-gray">
              v1
            </span>
          </div>
        </div>
        {navLinks}
        <div className="hidden lg:block">{sidebarFooter}</div>
        <div className="mt-8 lg:hidden">{sidebarFooter}</div>
      </aside>
    </>
  );
}
