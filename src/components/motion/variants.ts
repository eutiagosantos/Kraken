import type { Transition, Variants } from "framer-motion";

export type RevealDirection = "up" | "left" | "right" | "scale";

const baseEase = "easeOut" as const;

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: baseEase },
  },
} satisfies Variants;

export const fadeLeftVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: baseEase },
  },
} satisfies Variants;

export const fadeRightVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: baseEase },
  },
} satisfies Variants;

export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: baseEase },
  },
} satisfies Variants;

export const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
} satisfies Variants;

export function getDirectionVariants(direction: RevealDirection): Variants {
  switch (direction) {
    case "left":
      return fadeLeftVariants;
    case "right":
      return fadeRightVariants;
    case "scale":
      return scaleVariants;
    default:
      return fadeUpVariants;
  }
}

export function createRevealVariants(options?: {
  direction?: RevealDirection;
  duration?: number;
  delay?: number;
}): Variants {
  const direction = options?.direction ?? "up";
  const duration = options?.duration ?? 0.6;
  const delay = options?.delay ?? 0;
  const base = getDirectionVariants(direction);
  const transition: Transition = {
    duration,
    ease: baseEase,
    delay,
  };

  return {
    hidden: base.hidden,
    visible: {
      ...base.visible,
      transition,
    },
  } satisfies Variants;
}

export function createContainerVariants(staggerDelay = 0.12): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  } satisfies Variants;
}

export function createStaggerItemVariants(direction: RevealDirection = "up"): Variants {
  return getDirectionVariants(direction);
}
