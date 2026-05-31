"use client";

import type { Variants } from "framer-motion";
import Image from "next/image";
import { motion } from "framer-motion";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import {
  RevealStagger,
  getStaggerItemVariants,
} from "@/components/motion/RevealStagger";

const items = [
  {
    end: 10,
    suffix: "×",
    title: "Escala Sem Limites",
    desc: "Distribua volume entre contas e estruturas sem engessar sua operação.",
  },
  {
    end: 2,
    suffix: "×",
    title: "Mais Anúncios Aprovados",
    desc: "Checklists e padronização que reduzem inconsistências antes do envio.",
  },
  {
    end: "24/7",
    suffix: "",
    title: "Suporte Dedicado",
    desc: "Especialistas que entendem Meta Ads em escala — quando você precisar.",
  },
] as const;

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.45, ease: "easeOut" as const, delay: 0.15 },
  },
} satisfies Variants;

export function Features() {
  const itemVariants = getStaggerItemVariants("scale");

  return (
    <section
      id="recursos-adicionais"
      className="relative overflow-hidden border-y border-neutral-border bg-white py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(113,50,245,0.05),transparent_65%)]"
        aria-hidden
      />

      <Image
        src="/images/features-bg.svg"
        alt=""
        width={800}
        height={600}
        className="pointer-events-none absolute right-0 top-1/2 hidden w-[min(50%,520px)] -translate-y-1/2 opacity-[0.04] lg:block"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-12 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-silver">
            Resultados
          </p>
          <h2 className="mt-3 tracking-tight text-neutral-black">
            Benefícios adicionais
          </h2>
        </Reveal>

        <RevealStagger
          className="grid divide-y divide-neutral-border lg:grid-cols-3 lg:divide-x lg:divide-y-0"
          staggerDelay={0.2}
        >
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              className="flex flex-col px-0 py-8 first:pl-0 lg:px-10 lg:py-2 lg:first:pl-0 lg:last:pr-0"
            >
              <p className="font-display text-[3.5rem] font-bold leading-none tracking-tighter text-brand-purple">
                <CountUp end={item.end} suffix={item.suffix} duration={1.5} />
              </p>
              <motion.span
                variants={lineVariants}
                className="mt-3 block h-0.5 w-12 origin-left bg-brand-purple/40"
                aria-hidden
              />
              <h3 className="mt-4 font-ui text-lg font-semibold text-neutral-black">
                {item.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-gray">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
