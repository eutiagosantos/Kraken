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
  },
  {
    title: "Qualquer Estrutura",
    desc: "Compatível com estruturas complexas e contas em escala.",
    icon: Wrench,
  },
  {
    title: "Velocidade + Multi-Contas",
    desc: "Publique simultaneamente em várias contas com fluxo unificado.",
    icon: Gauge,
  },
  {
    title: "Economia de Tempo",
    desc: "Automatize etapas repetitivas e foque em criativo e testes.",
    icon: Clock,
  },
  {
    title: "Zero Retrabalho",
    desc: "Validação inteligente reduz reprovações e idas e vindas.",
    icon: Sparkles,
  },
  {
    title: "Escala Ilimitada",
    desc: "Da dezena ao milhar de anúncios sem travar sua operação.",
    icon: Layers,
  },
];

export function Benefits() {
  return (
    <section
      id="beneficios"
      className="bg-[rgba(148,151,169,0.06)] py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-neutral-black tracking-tight">
            Por que escolher a Kraken
          </h2>
          <p className="mt-4 text-lg leading-[1.38] text-neutral-gray">
            Operações sérias precisam de precisão, velocidade e proteção —
            exatamente onde nossa plataforma foi construída para brilhar.
          </p>
        </Reveal>

        <RevealStagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <motion.div
              key={b.title}
              variants={staggerItemVariants}
              whileHover={{
                y: -4,
                boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.06)",
              }}
              className="flex h-full flex-col rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle transition-shadow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple text-neutral-white shadow-micro">
                <b.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-5 font-ui text-[22px] font-semibold leading-[1.2] text-neutral-black">
                {b.title}
              </h3>
              <p className="mt-3 text-sm leading-[1.43] text-neutral-gray">
                {b.desc}
              </p>
            </motion.div>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
