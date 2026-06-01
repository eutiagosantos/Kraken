"use client";

import { motion } from "framer-motion";

type IconProps = {
  className?: string;
};

export function ConnectStepIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <rect x="18" y="42" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="3" />
      <rect x="66" y="42" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="3" />
      <motion.path
        d="M54 60h12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="60"
        cy="60"
        r="28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
        animate={{ scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "60px 60px" }}
      />
    </svg>
  );
}

export function PrepareStepIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      {[0, 1, 2].map((index) => (
        <motion.g
          key={index}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.35,
          }}
        >
          <rect
            x="28"
            y={28 + index * 22}
            width="64"
            height="14"
            rx="4"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d={`M34 ${35 + index * 22}l4 4 8-8`}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>
      ))}
    </svg>
  );
}

export function ConfigureStepIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "60px 60px" }}
      >
        <circle cx="60" cy="60" r="18" stroke="currentColor" strokeWidth="3" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <rect
            key={angle}
            x="56"
            y="22"
            width="8"
            height="14"
            rx="2"
            fill="currentColor"
            transform={`rotate(${angle} 60 60)`}
          />
        ))}
      </motion.g>
    </svg>
  );
}

export function PublishStepIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <path d="M54 78V46l24 16-24 16Z" fill="currentColor" opacity="0.2" />
      <motion.g
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <path
          d="M60 24c-2 14-10 22-22 24 12 2 20 10 22 24 2-14 10-22 22-24-12-2-20-10-22-24Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M48 88h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

export const stepIcons = [
  ConnectStepIcon,
  PrepareStepIcon,
  ConfigureStepIcon,
  PublishStepIcon,
] as const;
