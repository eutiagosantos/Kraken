"use client";

import { motion, type Variants } from "framer-motion";
import { stepIcons } from "@/components/icons/StepIcons";
import { Reveal } from "@/components/motion/Reveal";
import {
  RevealStagger,
  getStaggerItemVariants,
} from "@/components/motion/RevealStagger";

const steps = [
  {
    n: "01",
    title: "Conecte suas Contas",
    desc: "Centralize Business Managers e permissões com segurança.",
  },
  {
    n: "02",
    title: "Prepare seus Criativos",
    desc: "Organize conjuntos, textos e variações para publicação em lote.",
  },
  {
    n: "03",
    title: "Configure em Massa",
    desc: "Aplique regras, naming e estruturas consistentes em segundos.",
  },
  {
    n: "04",
    title: "Publique e Relaxe",
    desc: "Acompanhe filas, status e erros em um painel único.",
  },
];

const stepNumberVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" as const, delay: index * 0.2 },
  }),
} satisfies Variants;

const stepTextVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: index * 0.2 + 0.1 },
  }),
} satisfies Variants;

export function HowItWorks() {
  const itemVariants = getStaggerItemVariants("up");

  return (
    <section id="como-funciona" className="relative border-t border-neutral-border bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-silver">
            Processo
          </p>
          <h2 className="mt-3 tracking-tight text-neutral-black">Como funciona</h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-gray">
            Um fluxo linear pensado para times que publicam em volume todos os
            dias — sem fricção e sem surpresas.
          </p>
        </Reveal>

        <RevealStagger className="relative mx-auto mt-16 max-w-3xl" staggerDelay={0.2}>
          <div className="flex flex-col gap-10">
            {steps.map((step, index) => {
              const StepIcon = stepIcons[index] ?? stepIcons[0];

              return (
                <motion.div
                  key={step.n}
                  variants={itemVariants}
                  className="group relative flex gap-8"
                >
                  {index < steps.length - 1 && (
                    <motion.div
                      className="absolute left-[27px] top-14 hidden h-[calc(100%-8px)] w-px origin-top bg-gradient-to-b from-brand-purple via-brand-purple/35 to-transparent md:block"
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut",
                        delay: index * 0.2 + 0.25,
                      }}
                      aria-hidden
                    />
                  )}

                  <div className="relative flex shrink-0 flex-col items-center">
                    <motion.div
                      custom={index}
                      variants={stepNumberVariants}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple text-neutral-white shadow-micro ring-2 ring-brand-purple/20 ring-offset-2 ring-offset-neutral-white transition-colors duration-200 group-hover:bg-brand-purple-dark"
                    >
                      <span className="font-display text-sm font-bold tabular-nums text-white">
                        {step.n}
                      </span>
                    </motion.div>
                  </div>

                  <motion.div
                    custom={index}
                    variants={stepTextVariants}
                    className="relative flex flex-1 gap-5 overflow-hidden rounded-[16px] border border-neutral-border border-b-brand-purple/20 bg-neutral-white px-6 py-5 shadow-subtle"
                  >
                    <div className="hidden shrink-0 sm:block">
                      <StepIcon className="h-[120px] w-[120px] text-brand-purple/80" />
                    </div>
                    <div className="relative min-w-0 flex-1">
                      <span
                        className="pointer-events-none absolute -right-4 -top-6 select-none font-display text-[120px] font-bold leading-none text-neutral-black opacity-[0.04]"
                        aria-hidden
                      >
                        {step.n}
                      </span>
                      <h3 className="relative font-ui text-[22px] font-semibold leading-[1.2] text-neutral-black">
                        {step.title}
                      </h3>
                      <p className="relative mt-2 leading-[1.38] text-neutral-gray">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </RevealStagger>
      </div>
    </section>
  );
}
