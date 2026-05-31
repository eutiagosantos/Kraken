"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useMemo, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  createContainerVariants,
  createStaggerItemVariants,
  fadeUpVariants,
  type RevealDirection,
} from "./variants";

export interface RevealStaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  direction?: RevealDirection;
  amount?: number;
  once?: boolean;
}

export function RevealStagger({
  children,
  className,
  staggerDelay = 0.12,
  direction = "up",
  amount = 0.2,
  once = true,
}: RevealStaggerProps) {
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once, amount, margin: "-80px" });

  const containerVariants = useMemo(() => {
    if (shouldReduceMotion) {
      return {
        hidden: {},
        visible: {},
      };
    }

    return createContainerVariants(staggerDelay);
  }, [shouldReduceMotion, staggerDelay]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      data-stagger-direction={direction}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export const staggerItemVariants = fadeUpVariants;

export function getStaggerItemVariants(direction: RevealDirection = "up") {
  return createStaggerItemVariants(direction);
}
