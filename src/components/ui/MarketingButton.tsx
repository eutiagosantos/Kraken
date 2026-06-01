"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariantClasses, type ButtonVariant } from "@/components/ui/Button";
import { cn } from "@/libs/utils";

const MotionLink = motion.create(Link);

const motionSpring = { type: "spring" as const, stiffness: 420, damping: 28 };

type MarketingButtonProps = {
  variant?: ButtonVariant;
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
};

export function MarketingButton({
  variant = "primary",
  href,
  children,
  className,
  onClick,
  type = "button",
}: MarketingButtonProps) {
  const reduceMotion = useReducedMotion();

  const motionProps = {
    whileHover: reduceMotion ? undefined : { y: -2 },
    whileTap: reduceMotion ? undefined : { scale: 0.98 },
    transition: motionSpring,
  };

  const classes = cn(
    "group inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-50",
    buttonVariantClasses[variant],
    variant === "primary" &&
      "transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(113,50,245,0.18)]",
    className
  );

  if (href) {
    return (
      <MotionLink
        href={href}
        className={classes}
        onClick={onClick}
        {...motionProps}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
