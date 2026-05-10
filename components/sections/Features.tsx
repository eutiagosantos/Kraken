"use client";

import { motion } from "framer-motion";
import { Headphones, Rocket, ThumbsUp } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { RevealStagger, staggerItemVariants } from "@/components/motion/RevealStagger";

const items = [
  {
    title: "Escala Sem Limites",
    desc: "Distribua volume entre contas e estruturas sem engessar sua operação.",
    icon: Rocket,
  },
  {
    title: "2x Mais Anúncios Aprovados",
    desc: "Checklists e padronização que reduzem inconsistências antes do envio.",
    icon: ThumbsUp,
  },
  {
    title: "Suporte Dedicado",
    desc: "Especialistas que entendem Meta Ads em escala — quando você precisar.",
    icon: Headphones,
  },
];

export function Features() {
  return (
    <section id="recursos-adicionais" className="bg-neutral-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-neutral-black tracking-tight">
            Benefícios adicionais
          </h2>
          <p className="mt-4 text-lg leading-[1.38] text-neutral-gray">
            O pacote completo para times que tratam campanha como produto —
            previsível, mensurável e reproduzível.
          </p>
        </Reveal>

        <RevealStagger className="mt-14 flex flex-col gap-5 lg:flex-row">
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={staggerItemVariants}
              whileHover={{
                y: -4,
                boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.06)",
              }}
              className="flex flex-1 flex-col rounded-card border border-neutral-border bg-neutral-white p-8 shadow-subtle transition-shadow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple text-neutral-white shadow-micro">
                <item.icon className="h-5 w-5 text-white" strokeWidth={1.75} />
              </div>
              <h3 className="mt-7 font-ui text-[22px] font-semibold leading-[1.2] text-neutral-black">
                {item.title}
              </h3>
              <p className="mt-4 flex-1 leading-[1.38] text-neutral-gray">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
