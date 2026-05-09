"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, FolderKanban, Images, Megaphone, Upload, Users } from "lucide-react";
import { StatCard } from "@/components/app/ui/StatCard";
import { mockHomeCreativesCampaignStats, type MockStat, type StatIconKey } from "@/lib/mock-data";

const icons: Record<StatIconKey, LucideIcon> = {
  megaphone: Megaphone,
  folderKanban: FolderKanban,
  images: Images,
  badgeCheck: BadgeCheck,
  users: Users,
  upload: Upload,
};

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

export function StatsRow({ stats = mockHomeCreativesCampaignStats }: StatsRowProps) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {stats.map((s) => {
        const Icon = s.icon ? icons[s.icon] : undefined;
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
