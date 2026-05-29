"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { RevealStagger, staggerItemVariants } from "@/components/motion/RevealStagger";

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

export function HowItWorks() {
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

        <RevealStagger className="relative mx-auto mt-16 max-w-2xl">
          <div
            className="absolute left-[27px] top-4 hidden h-[calc(100%-32px)] w-px bg-gradient-to-b from-brand-purple via-brand-purple/35 to-transparent md:block"
            aria-hidden
          />
          <div className="flex flex-col gap-10">
            {steps.map((s) => (
              <motion.div
                key={s.n}
                variants={staggerItemVariants}
                className="relative flex gap-8"
              >
                <div className="relative flex shrink-0 flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple text-neutral-white shadow-micro ring-2 ring-brand-purple/20 ring-offset-2 ring-offset-neutral-white">
                    <span className="font-display text-sm font-bold tabular-nums text-white">
                      {s.n}
                    </span>
                  </div>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-[16px] border border-neutral-border border-b-brand-purple/20 bg-neutral-white px-6 py-5 shadow-subtle">
                  <span
                    className="pointer-events-none absolute -right-4 -top-6 select-none font-display text-[120px] font-bold leading-none text-neutral-black opacity-[0.04]"
                    aria-hidden
                  >
                    {s.n}
                  </span>
                  <h3 className="relative font-ui text-[22px] font-semibold leading-[1.2] text-neutral-black">
                    {s.title}
                  </h3>
                  <p className="relative mt-2 leading-[1.38] text-neutral-gray">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </RevealStagger>
      </div>
    </section>
  );
}
