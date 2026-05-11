"use client";

import { motion } from "framer-motion";
import { RevealStagger, staggerItemVariants } from "@/components/motion/RevealStagger";

const items = [
  { title: "10x Mais Rápido", desc: "Menos cliques, mais campanhas no ar." },
  { title: "0 Erros Humanos", desc: "Validações automáticas antes da publicação." },
  { title: "Suporte 24/7", desc: "Time especializado em escala com Meta Ads." },
];

export function Stats() {
  return (
    <RevealStagger className="mt-12 grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <motion.div
          key={item.title}
          variants={staggerItemVariants}
          whileHover={{ y: -2 }}
          className="rounded-xl border border-neutral-border bg-neutral-white px-4 py-4 shadow-subtle transition-shadow hover:shadow-micro"
        >
          <p className="font-display text-base font-bold text-neutral-black">
            {item.title}
          </p>
          <p className="mt-1.5 text-sm leading-[1.43] text-neutral-gray">
            {item.desc}
          </p>
        </motion.div>
      ))}
    </RevealStagger>
  );
}
