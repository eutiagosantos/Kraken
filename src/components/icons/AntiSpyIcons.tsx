"use client";

import { motion } from "framer-motion";

type IconProps = {
  className?: string;
};

export function ShufflePagesIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {[0, 1, 2].map((index) => (
        <motion.rect
          key={index}
          x={8 + index * 10}
          y={10 + index * 4}
          width="22"
          height="28"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          fill="rgba(113,50,245,0.08)"
          animate={{ rotate: [0, index % 2 === 0 ? -4 : 4, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.2,
          }}
          style={{ transformOrigin: `${19 + index * 10}px ${24 + index * 4}px` }}
        />
      ))}
    </svg>
  );
}

export function CamouflagedLinkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <motion.path
        d="M12 24h8M28 24h8M20 24a4 4 0 0 1 0-8h8a4 4 0 0 1 0 8M20 24a4 4 0 0 0 0 8h8a4 4 0 0 0 0-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ opacity: [1, 0.45, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="24"
        cy="24"
        r="16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "24px 24px" }}
      />
    </svg>
  );
}

export function HiddenCreativeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M8 24c0-8.837 7.163-16 16-16 3.2 0 6.18.94 8.68 2.56"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <motion.path
        d="M10 10 38 38"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <motion.ellipse
        cx="24"
        cy="26"
        rx="10"
        ry="6"
        stroke="currentColor"
        strokeWidth="2"
        animate={{ scaleY: [1, 0.15, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "24px 26px" }}
      />
      <circle cx="24" cy="18" r="3" fill="currentColor" />
    </svg>
  );
}
