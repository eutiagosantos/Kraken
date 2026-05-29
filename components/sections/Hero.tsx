"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DEMO_PUBLICATION_QUEUE_SUMMARY,
  PublicationQueuePanel,
} from "@/components/publication-queue/PublicationQueuePanel";
import { Stats } from "@/components/sections/Stats";
import { buttonVariantClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden hero-editorial"
    >
      <div
        className="pointer-events-none absolute left-0 top-0 hidden h-full w-1 hero-accent-bar lg:block"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-silver">
              Upload em massa · Meta Ads
            </p>

            <h1 className="text-balance font-display text-[clamp(2.25rem,5.5vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.04em] text-neutral-black">
              Publique{" "}
              <span className="relative inline-block">
                <span className="relative z-[1]">100+ campanhas</span>
                <span
                  className="absolute -bottom-1 left-0 h-3 w-full bg-brand-purple/20"
                  aria-hidden
                />
              </span>{" "}
              no Meta Ads com um clique
            </h1>

            <div className="editorial-rule mt-8 max-w-xs" />

            <p className="mt-8 max-w-lg text-lg leading-relaxed text-neutral-gray">
              Centralize contas, valide criativos e dispare lotes inteiros em
              minutos — sem planilhas, sem retrabalho, sem erro humano.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/cadastro"
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  buttonVariantClasses.primary
                )}
              >
                Começar grátis
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="#como-funciona"
                className={cn(
                  "inline-flex items-center justify-center",
                  buttonVariantClasses.outlined
                )}
              >
                Ver como funciona
              </Link>
            </div>

            <Stats />
          </div>

          <div className="relative mx-auto w-full max-w-[440px] pb-8 lg:mx-0 lg:max-w-none lg:pb-0">
            <span
              className="pointer-events-none absolute -right-6 -top-8 select-none font-display text-[9rem] font-bold leading-none tracking-tighter text-neutral-black/[0.04] lg:-right-10 lg:text-[11rem]"
              aria-hidden
            >
              100+
            </span>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <PublicationQueuePanel
                summary={DEMO_PUBLICATION_QUEUE_SUMMARY}
                animate
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
