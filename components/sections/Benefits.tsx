"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Gauge,
  Layers,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { RevealStagger, staggerItemVariants } from "@/components/motion/RevealStagger";

const benefits = [
  {
    title: "Anti-Spy",
    desc: "Menos ruído competitivo e maior vida útil das suas ofertas.",
    icon: ShieldCheck,
    span: "lg:col-span-2",
  },
  {
    title: "Qualquer Estrutura",
    desc: "Compatível com estruturas complexas e contas em escala.",
    icon: Wrench,
    span: "",
  },
  {
    title: "Velocidade + Multi-Contas",
    desc: "Publique simultaneamente em várias contas com fluxo unificado.",
    icon: Gauge,
    span: "",
  },
  {
    title: "Economia de Tempo",
    desc: "Automatize etapas repetitivas e foque em criativo e testes.",
    icon: Clock,
    span: "",
  },
  {
    title: "Zero Retrabalho",
    desc: "Validação inteligente reduz reprovações e idas e vindas.",
    icon: Sparkles,
    span: "lg:col-span-2",
  },
  {
    title: "Escala Ilimitada",
    desc: "Da dezena ao milhar de anúncios sem travar sua operação.",
    icon: Layers,
    span: "",
  },
];

export function Benefits() {
  return (
    <section id="beneficios" className="bg-[#FAFAF7] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-silver">
            Benefícios
          </p>
          <h2 className="mt-3 tracking-tight text-neutral-black">
            Por que escolher a Kraken
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-gray">
            Operações sérias precisam de precisão, velocidade e proteção —
            exatamente onde nossa plataforma foi construída para brilhar.
          </p>
        </Reveal>

        <RevealStagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, index) => (
            <motion.div
              key={b.title}
              variants={staggerItemVariants}
              className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-border bg-white p-6 transition-shadow hover:shadow-subtle ${b.span}`}
            >
              <span
                className="pointer-events-none absolute right-4 top-3 font-display text-5xl font-bold tabular-nums leading-none text-neutral-black/[0.05]"
                aria-hidden
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <b.icon
                className="h-5 w-5 text-brand-purple"
                strokeWidth={1.75}
                aria-hidden
              />
              <h3 className="mt-4 font-ui text-lg font-semibold leading-snug text-neutral-black">
                {b.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-gray">
                {b.desc}
              </p>
              <div
                className="mt-5 h-0.5 w-8 bg-brand-purple/30 transition-all group-hover:w-12 group-hover:bg-brand-purple"
                aria-hidden
              />
            </motion.div>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
