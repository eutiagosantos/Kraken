"use client";

import { motion } from "framer-motion";
import { CheckCircle, Upload, Users, Zap } from "lucide-react";
import { StatCard } from "@/components/app/ui/StatCard";
import { mockStats } from "@/lib/mock-data";

const icons = {
  zap: Zap,
  users: Users,
  upload: Upload,
  checkCircle: CheckCircle,
} as const;

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

export function StatsRow() {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {mockStats.map((s) => {
        const Icon = icons[s.icon];
        return (
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
              icon={Icon}
              iconBg={s.iconBg}
              iconColor={s.iconColor}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
