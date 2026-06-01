"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useMemo, useRef, type ReactNode } from "react";
import { cn } from "@/libs/utils";
import {
  createRevealVariants,
  fadeUpVariants,
  type RevealDirection,
} from "./variants";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  duration?: number;
  direction?: RevealDirection;
  amount?: number;
  once?: boolean;
}

export function Reveal({
  children,
  className,
  variants,
  delay = 0,
  duration = 0.6,
  direction = "up",
  amount = 0.2,
  once = true,
}: RevealProps) {
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once, amount, margin: "-80px" });

  const resolvedVariants = useMemo(() => {
    if (shouldReduceMotion) {
      return {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      } satisfies Variants;
    }

    if (variants) {
      return variants;
    }

    return createRevealVariants({ direction, duration, delay });
  }, [shouldReduceMotion, variants, direction, duration, delay]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={resolvedVariants}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export { fadeUpVariants };
