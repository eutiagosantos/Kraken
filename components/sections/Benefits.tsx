"use client";

import { motion } from "framer-motion";
import { benefitIcons } from "@/components/icons/BenefitIcons";
import { Reveal } from "@/components/motion/Reveal";
import {
  RevealStagger,
  getStaggerItemVariants,
} from "@/components/motion/RevealStagger";

const benefits = [
  {
    title: "Anti-Spy",
    desc: "Menos ruído competitivo e maior vida útil das suas ofertas.",
    span: "lg:col-span-2",
  },
  {
    title: "Qualquer Estrutura",
    desc: "Compatível com estruturas complexas e contas em escala.",
    span: "",
  },
  {
    title: "Velocidade + Multi-Contas",
    desc: "Publique simultaneamente em várias contas com fluxo unificado.",
    span: "",
  },
  {
    title: "Economia de Tempo",
    desc: "Automatize etapas repetitivas e foque em criativo e testes.",
    span: "",
  },
  {
    title: "Zero Retrabalho",
    desc: "Validação inteligente reduz reprovações e idas e vindas.",
    span: "lg:col-span-2",
  },
  {
    title: "Escala Ilimitada",
    desc: "Da dezena ao milhar de anúncios sem travar sua operação.",
    span: "",
  },
];

export function Benefits() {
  const itemVariants = getStaggerItemVariants("up");

  return (
    <section id="beneficios" className="bg-[#FAFAF7] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl" direction="left">
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

        <RevealStagger
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          staggerDelay={0.1}
        >
          {benefits.map((benefit, index) => {
            const Icon = benefitIcons[index] ?? benefitIcons[0];

            return (
              <motion.div
                key={benefit.title}
                variants={itemVariants}
                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-border bg-transparent p-6 transition-all duration-300 hover:bg-brand-purple/[0.04] hover:shadow-md ${benefit.span}`}
              >
                <div
                  className="absolute left-0 top-0 h-0.5 w-8 bg-brand-purple/30 transition-all group-hover:w-full group-hover:bg-brand-purple"
                  aria-hidden
                />
                <motion.div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-purple/15 bg-brand-purple-subtle text-brand-purple"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </motion.div>
                <span
                  className="mt-4 font-display text-4xl font-bold tabular-nums leading-none text-brand-purple/20 transition-colors group-hover:text-brand-purple/30"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-ui text-lg font-semibold leading-snug text-neutral-black">
                  {benefit.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-gray">
                  {benefit.desc}
                </p>
              </motion.div>
            );
          })}
        </RevealStagger>
      </div>
    </section>
  );
}
