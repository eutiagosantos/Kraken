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
      className="relative overflow-hidden section-band-lavender py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
          <Reveal className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-purple-dark">
              Anti-Spy
            </p>
            <h2 className="mt-4 text-balance tracking-tight text-neutral-black">
              Proteja suas ofertas e fique invisível na biblioteca de anúncios
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-neutral-gray">
              Camadas inteligentes para distribuir risco, ofuscar rastros e
              preservar criativos de alto desempenho por mais tempo.
            </p>
          </Reveal>

          <RevealStagger className="flex flex-col gap-4">
            {cards.map((c, index) => (
              <motion.div
                key={c.title}
                variants={staggerItemVariants}
                whileHover={{ x: 4 }}
                className="group flex gap-5 rounded-2xl border border-white/80 bg-white/70 p-6 shadow-subtle backdrop-blur-sm transition-shadow hover:bg-white hover:shadow-micro"
              >
                <div className="flex shrink-0 flex-col items-center gap-3">
                  <span className="font-display text-xs font-bold tabular-nums text-brand-purple/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-purple/15 bg-brand-purple-subtle text-brand-purple transition-colors group-hover:border-brand-purple/30 group-hover:bg-brand-purple group-hover:text-white">
                    <c.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="font-ui text-lg font-semibold leading-snug text-neutral-black">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-gray">
                    {c.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}
