"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";
import {
  formatCountUpValue,
  parseCountUpEnd,
} from "@/lib/motion/count-up-utils";
import { cn } from "@/lib/utils";

export interface CountUpProps {
  end: number | string;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({
  end,
  duration = 1.5,
  suffix = "",
  prefix = "",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const parsed = parseCountUpEnd(end);
  const count = useMotionValue(0);
  const display = useTransform(count, (value) => {
    if (parsed.kind === "static") {
      return `${prefix}${parsed.value}${suffix}`;
    }

    return `${prefix}${formatCountUpValue(value, parsed.decimals)}${suffix}`;
  });

  useEffect(() => {
    if (!isInView) {
      return;
    }

    if (parsed.kind === "static" || shouldReduceMotion) {
      return;
    }

    const controls = animate(count, parsed.end, {
      duration,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [count, duration, isInView, parsed, shouldReduceMotion]);

  if (parsed.kind === "static" || shouldReduceMotion) {
    const staticValue =
      parsed.kind === "static"
        ? parsed.value
        : formatCountUpValue(parsed.end, parsed.decimals);

    return (
      <span ref={ref} className={cn("tabular-nums", className)}>
        {prefix}
        {staticValue}
        {suffix}
      </span>
    );
  }

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </motion.span>
  );
}
