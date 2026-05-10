"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { containerVariants, fadeUpVariants } from "./variants";

type RevealStaggerProps = {
  children: ReactNode;
  className?: string;
};

export function RevealStagger({ children, className }: RevealStaggerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export const staggerItemVariants = fadeUpVariants;
