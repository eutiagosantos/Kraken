"use client";

import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariantClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type KrakenLoginHeaderProps = {
  ctaLabel?: string;
  ctaHref?: string;
};

export function KrakenLoginHeader({
  ctaLabel = "Criar conta",
  ctaHref = "/cadastro",
}: KrakenLoginHeaderProps = {}) {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="flex items-center gap-2.5 text-[#5741CF] transition-opacity hover:opacity-90"
      >
        <Image
          src="/kraken-mark.svg"
          alt=""
          width={32}
          height={32}
          priority
        />
        <span className="font-display text-xl font-semibold lowercase tracking-tight">
          kraken
        </span>
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
