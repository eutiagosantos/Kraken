"use client";

import { motion } from "framer-motion";
import { StatCard } from "@/components/app/ui/StatCard";
import type { MockStat } from "@/lib/mock-data";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

type StatsRowProps = {
  stats?: MockStat[];
};

export function StatsRow({ stats = [] }: StatsRowProps) {
  if (stats.length === 0) {
    return (
      <div className="rounded-card border border-dashboard-border bg-dashboard-surface px-4 py-6 text-sm text-dashboard-muted shadow-subtle">
        Ainda não há KPIs registados. Conecta contas Meta e usa a app para ver métricas aqui.
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={item}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] as const }}
        >
          <StatCard
            label={s.label}
            value={s.value}
            delta={s.delta}
            deltaType={s.deltaType}
            iconColor={s.iconColor}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
