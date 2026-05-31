"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import {
  CamouflagedLinkIcon,
  HiddenCreativeIcon,
  ShufflePagesIcon,
} from "@/components/icons/AntiSpyIcons";
import {
  RevealStagger,
  getStaggerItemVariants,
} from "@/components/motion/RevealStagger";

const cards = [
  {
    title: "Randomize FanPages",
    desc: "Poucos anúncios por Fan Page para diluir padrões e reduzir correlações.",
    Icon: ShufflePagesIcon,
  },
  {
    title: "Link de exibição camuflado",
    desc: "Evita rastreamento direto de Fan Pages e reduz exposição na biblioteca.",
    Icon: CamouflagedLinkIcon,
  },
  {
    title: "Esconda seus Criativos",
    desc: "Modo catálogo e camadas adicionais dificultam cópia e espionagem.",
    Icon: HiddenCreativeIcon,
  },
];

export function AntiSpy() {
  const itemVariants = getStaggerItemVariants("up");

  return (
    <section
      id="anti-spy"
      className="relative overflow-hidden section-band-lavender landing-grain py-24"
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

          <RevealStagger className="flex flex-col gap-4" staggerDelay={0.15}>
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
                className="group relative flex gap-5 overflow-hidden rounded-2xl border border-white/80 bg-white/70 p-6 shadow-subtle backdrop-blur-sm transition-shadow hover:bg-white hover:shadow-micro"
              >
                <span
                  className="absolute bottom-0 left-0 top-0 w-1 origin-top scale-y-0 bg-brand-purple transition-transform duration-200 group-hover:scale-y-100"
                  aria-hidden
                />
                <div className="flex shrink-0 flex-col items-center gap-3">
                  <span className="font-display text-xs font-bold tabular-nums text-brand-purple/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-brand-purple/15 bg-brand-purple-subtle text-brand-purple transition-colors group-hover:border-brand-purple/30 group-hover:bg-brand-purple group-hover:text-white">
                    <motion.div
                      className="h-8 w-8"
                      whileHover={{ rotate: -8, scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <card.Icon className="h-full w-full" />
                    </motion.div>
                  </div>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="font-ui text-lg font-semibold leading-snug text-neutral-black">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-gray">
                    {card.desc}
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
