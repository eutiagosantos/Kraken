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
    <section id="como-funciona" className="relative bg-neutral-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-neutral-black tracking-tight">Como funciona</h2>
          <p className="mt-4 text-lg leading-[1.38] text-neutral-gray">
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-purple text-neutral-white shadow-micro ring-4 ring-brand-purple/12">
                    <span className="font-display text-sm font-bold text-white tabular-nums">
                      {s.n}
                    </span>
                  </div>
                </div>
                <div className="flex-1 rounded-[16px] border border-neutral-border bg-neutral-white px-6 py-5 shadow-subtle">
                  <h3 className="font-ui text-[22px] font-semibold leading-[1.2] text-neutral-black">
                    {s.title}
                  </h3>
                  <p className="mt-2 leading-[1.38] text-neutral-gray">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </RevealStagger>
      </div>
    </section>
  );
}
