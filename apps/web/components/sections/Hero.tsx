"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BarChart3, Layers, Zap } from "lucide-react";
import { Stats } from "@/components/sections/Stats";
import { buttonVariantClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-neutral-white bg-grid hero-bg"
    >
      <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-4 pb-20 pt-14 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="flex-1">
          <span className="mb-6 inline-flex items-center gap-2 rounded-[12px] bg-brand-purple-subtle px-3 py-1.5 text-sm font-semibold text-brand-purple">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple animate-pulse" />
            Plataforma #1 para Meta Ads
          </span>

          <h1 className="mt-2 text-balance font-display font-bold leading-[1.1] text-neutral-black tracking-[-0.035em] text-[clamp(2rem,5vw,3rem)] lg:text-display-xl lg:leading-[1.17] lg:tracking-[-0.020833em]">
            Publique 100+ Campanhas no{" "}
            <span className="bg-gradient-to-r from-brand-purple via-brand-purple-dark to-brand-purple-deep bg-clip-text text-transparent">
              META ADS
            </span>
          </h1>

          <p className="mt-5 font-display text-xl font-bold tracking-tight text-brand-purple max-md:text-lg md:text-2xl">
            Com 1 clique · 1 minuto · Zero erros
          </p>

          <p className="mt-5 max-w-xl text-base leading-[1.38] text-neutral-gray">
            Faça upload de centenas de campanhas em múltiplas contas.
            Automatizado e sem erros, em minutos.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="#planos"
              className={cn(
                "inline-flex items-center justify-center",
                buttonVariantClasses.primary
              )}
            >
              Ver Planos
            </Link>
            <Link
              href="#como-funciona"
              className={cn(
                "inline-flex items-center justify-center",
                buttonVariantClasses.outlined
              )}
            >
              Como Funciona
            </Link>
          </div>

          <Stats />
        </div>

        <div className="relative flex flex-1 justify-center lg:justify-end">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-full max-w-[420px] rounded-card border border-neutral-border bg-neutral-white p-4 shadow-subtle"
          >
            <div className="flex items-center justify-between border-b border-neutral-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple-subtle text-brand-purple ring-1 ring-brand-purple/20">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-silver">
                    Painel
                  </p>
                  <p className="text-sm font-semibold text-neutral-black">
                    Upload em massa
                  </p>
                </div>
              </div>
              <span className="rounded-[6px] bg-semantic-green-bg px-2.5 py-1 text-xs font-semibold text-semantic-green-dark">
                Ativo
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { name: "Campanhas em fila", val: "124", icon: Zap },
                { name: "Anúncios publicados (hoje)", val: "2.480", icon: BarChart3 },
                { name: "Contas conectadas", val: "18", icon: Layers },
              ].map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between rounded-xl border border-neutral-border bg-neutral-white px-3 py-3 shadow-micro"
                >
                  <div className="flex items-center gap-3">
                    <row.icon className="h-4 w-4 text-brand-purple" />
                    <span className="text-sm font-medium text-neutral-gray">
                      {row.name}
                    </span>
                  </div>
                  <span className="font-display text-sm font-bold text-neutral-black">
                    {row.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-brand-purple/15 bg-brand-purple-subtle/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-purple-dark">
                  Próximo lote
                </span>
                <span className="text-xs font-medium text-neutral-silver">
                  ~58s
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-border">
                <div
                  className="h-full w-[72%] rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark"
                  aria-hidden
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
