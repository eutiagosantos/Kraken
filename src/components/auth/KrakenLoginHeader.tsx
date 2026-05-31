"use client";

import { Globe } from "lucide-react";
import Link from "next/link";
import { KrakenMarkTile } from "@/components/branding/KrakenMarkTile";
import { buttonVariantClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type KrakenLoginHeaderProps = {
  ctaLabel?: string;
  ctaHref?: string;
  compact?: boolean;
};

export function KrakenLoginHeader({
  ctaLabel = "Criar conta",
  ctaHref = "/cadastro",
  compact = false,
}: KrakenLoginHeaderProps = {}) {
  return (
    <header
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8",
        compact ? "py-3 sm:py-4" : "py-6"
      )}
    >
      <Link
        href="/"
        aria-label="Kraken"
        className="flex items-center text-[#5741CF] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5741CF]/30 focus-visible:ring-offset-2"
      >
        <KrakenMarkTile size="sm" priority />
        <span className="sr-only">Kraken</span>
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm font-medium text-neutral-black hover:bg-black/[0.03]">
          <Globe className="h-4 w-4 shrink-0 text-neutral-gray" aria-hidden />
          <select
            className="cursor-pointer bg-transparent font-ui text-sm font-medium text-neutral-black outline-none"
            defaultValue="pt-BR"
            aria-label="Idioma"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en">English</option>
          </select>
        </label>

        <Link
          href={ctaHref}
          className={cn(
            "inline-flex items-center justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold sm:text-base",
            buttonVariantClasses.outlined
          )}
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
