"use client";

import { motion } from "framer-motion";
import { EyeOff, Link2, Shuffle } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { RevealStagger, staggerItemVariants } from "@/components/motion/RevealStagger";

const cards = [
  {
    title: "Randomize FanPages",
    desc: "Poucos anúncios por Fan Page para diluir padrões e reduzir correlações.",
    icon: Shuffle,
  },
  {
    title: "Link de exibição camuflado",
    desc: "Evita rastreamento direto de Fan Pages e reduz exposição na biblioteca.",
    icon: Link2,
  },
  {
    title: "Esconda seus Criativos",
    desc: "Modo catálogo e camadas adicionais dificultam cópia e espionagem.",
    icon: EyeOff,
  },
];

export function AntiSpy() {
  return (
    <section
      id="anti-spy"
      className="relative overflow-hidden bg-neutral-white bg-grid py-24 hero-bg"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-[12px] bg-brand-purple-subtle px-3 py-1.5 text-sm font-semibold text-brand-purple">
            Anti-Spy
          </span>
          <h2 className="mt-4 text-balance text-neutral-black tracking-tight">
            Proteja suas ofertas e fique{" "}
            <span className="bg-gradient-to-r from-brand-purple to-brand-purple-dark bg-clip-text text-transparent">
              invisível
            </span>{" "}
            na biblioteca de anúncios
          </h2>
          <p className="mt-5 text-lg leading-[1.38] text-neutral-gray">
            Camadas inteligentes para distribuir risco, ofuscar rastros e
            preservar seus criativos de alto desempenho.
          </p>
        </Reveal>

        <RevealStagger className="mt-14 grid gap-5 md:grid-cols-3">
          {cards.map((c) => (
            <motion.div
              key={c.title}
              variants={staggerItemVariants}
              whileHover={{ y: -4 }}
              className="rounded-card border border-neutral-border bg-neutral-white p-7 shadow-subtle transition-shadow hover:shadow-micro"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple text-neutral-white shadow-micro">
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-6 font-ui text-[22px] font-semibold leading-[1.2] text-neutral-black">
                {c.title}
              </h3>
              <p className="mt-3 text-sm leading-[1.43] text-neutral-gray">
                {c.desc}
              </p>
            </motion.div>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
