"use client";

import { motion } from "framer-motion";
import type { ContaMeta } from "@/lib/mock-contas";
import { ConnectNewCard } from "./ConnectNewCard";
import { ContaCard } from "./ContaCard";

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
};

export function ContasGrid({
  contas,
  onOpenMetrics,
  onEdit,
  onReconnect,
  onDisconnect,
  onConnectNew,
}: {
  contas: ContaMeta[];
  onOpenMetrics: (c: ContaMeta) => void;
  onEdit: (c: ContaMeta) => void;
  onReconnect: (c: ContaMeta) => void;
  onDisconnect: (c: ContaMeta) => void;
  onConnectNew: () => void;
}) {
  return (
    <motion.div
      className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5"
      variants={gridVariants}
      initial="hidden"
      animate="visible"
    >
      {contas.map((c) => (
        <ContaCard
          key={c.id}
          conta={c}
          cardVariants={cardVariants}
          onOpenMetrics={() => onOpenMetrics(c)}
          onEdit={() => onEdit(c)}
          onReconnect={() => onReconnect(c)}
          onDisconnect={() => onDisconnect(c)}
        />
      ))}
      <ConnectNewCard onClick={onConnectNew} cardVariants={cardVariants} />
    </motion.div>
  );
}
