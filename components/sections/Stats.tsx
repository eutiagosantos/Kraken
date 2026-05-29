"use client";

import { motion } from "framer-motion";
import { RevealStagger, staggerItemVariants } from "@/components/motion/RevealStagger";

const items = [
  { value: "10×", label: "mais rápido" },
  { value: "0", label: "erros humanos" },
  { value: "24/7", label: "suporte" },
];

export function Stats() {
  return (
    <RevealStagger className="mt-12 flex flex-wrap items-stretch divide-y divide-neutral-border border-y border-neutral-border sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <motion.div
          key={item.label}
          variants={staggerItemVariants}
          className="flex flex-1 flex-col justify-center py-4 pr-6 sm:px-6 sm:first:pl-0"
        >
          <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-neutral-black">
            {item.value}
          </p>
          <p className="mt-1 text-sm font-medium uppercase tracking-wide text-neutral-silver">
            {item.label}
          </p>
        </motion.div>
      ))}
    </RevealStagger>
  );
}
