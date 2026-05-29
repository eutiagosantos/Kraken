"use client";

import { Reveal } from "@/components/motion/Reveal";
import { RevealStagger, staggerItemVariants } from "@/components/motion/RevealStagger";
import { motion } from "framer-motion";

const items = [
  {
    metric: "10×",
    title: "Escala Sem Limites",
    desc: "Distribua volume entre contas e estruturas sem engessar sua operação.",
  },
  {
    metric: "2×",
    title: "Mais Anúncios Aprovados",
    desc: "Checklists e padronização que reduzem inconsistências antes do envio.",
  },
  {
    metric: "24/7",
    title: "Suporte Dedicado",
    desc: "Especialistas que entendem Meta Ads em escala — quando você precisar.",
  },
];

export function Features() {
  return (
    <section id="recursos-adicionais" className="border-y border-neutral-border bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-12 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-silver">
            Resultados
          </p>
          <h2 className="mt-3 tracking-tight text-neutral-black">
            Benefícios adicionais
          </h2>
        </Reveal>

        <RevealStagger className="grid divide-y divide-neutral-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={staggerItemVariants}
              className="flex flex-col px-0 py-8 first:pl-0 lg:px-10 lg:py-2 lg:first:pl-0 lg:last:pr-0"
            >
              <p className="font-display text-[3.5rem] font-bold leading-none tracking-tighter text-brand-purple">
                {item.metric}
              </p>
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
