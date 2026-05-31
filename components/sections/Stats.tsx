"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/motion/CountUp";
import {
  RevealStagger,
  getStaggerItemVariants,
} from "@/components/motion/RevealStagger";

const items = [
  { end: 10, suffix: "×", label: "mais rápido" },
  { end: 0, suffix: "", label: "erros humanos" },
  { end: "24/7", suffix: "", label: "suporte" },
] as const;

type StatsProps = {
  delay?: number;
};

export function Stats({ delay = 0 }: StatsProps) {
  const itemVariants = getStaggerItemVariants("up");

  return (
    <RevealStagger
      className="mt-12 flex flex-wrap items-stretch divide-y divide-neutral-border border-y border-neutral-border sm:divide-x sm:divide-y-0"
      staggerDelay={0.12}
      amount={0.3}
    >
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          variants={itemVariants}
          transition={{ delay: delay + index * 0.08 }}
          className="flex flex-1 flex-col justify-center py-4 pr-6 sm:px-6 sm:first:pl-0"
        >
          <p className="font-display text-3xl font-bold tracking-tight text-neutral-black">
            <CountUp end={item.end} suffix={item.suffix} duration={1.5} />
          </p>
          <p className="mt-1 text-sm font-medium uppercase tracking-wide text-neutral-silver">
            {item.label}
          </p>
        </motion.div>
      ))}
    </RevealStagger>
  );
}
