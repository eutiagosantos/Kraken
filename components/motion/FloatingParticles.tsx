"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface FloatingParticlesProps {
  count?: number;
  color?: string;
  className?: string;
}

type Particle = {
  id: number;
  left: string;
  top: string;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
};

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: `${8 + ((id * 17) % 84)}%`,
    top: `${6 + ((id * 23) % 88)}%`,
    size: id % 3 === 0 ? 4 : 3,
    opacity: 0.2 + (id % 3) * 0.1,
    duration: 3.5 + (id % 4) * 0.75,
    delay: (id % 6) * 0.35,
    drift: id % 2 === 0 ? -8 : 8,
  }));
}

export function FloatingParticles({
  count = 14,
  color = "bg-brand-purple",
  className,
}: FloatingParticlesProps) {
  const shouldReduceMotion = useReducedMotion();
  const particles = useMemo(() => createParticles(count), [count]);

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className={cn("absolute rounded-full will-change-transform", color)}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, particle.drift, 0],
            opacity: [particle.opacity, particle.opacity + 0.15, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}
