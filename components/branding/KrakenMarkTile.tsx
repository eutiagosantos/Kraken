import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeStyles = {
  xs: {
    outer:
      "h-11 w-11 rounded-xl shadow-md shadow-purple-500/25",
    inset: "inset-[2px] rounded-[10px]",
    imgSize: 24,
    imgClass: "drop-shadow-md brightness-0 invert",
  },
  sm: {
    outer:
      "h-8 w-8 rounded-[10px] shadow-md shadow-purple-500/20",
    inset: "inset-[2px] rounded-[7px]",
    imgSize: 18,
    imgClass: "drop-shadow brightness-0 invert",
  },
  md: {
    outer:
      "h-16 w-16 rounded-2xl shadow-lg shadow-purple-500/25",
    inset: "inset-[3px] rounded-[13px]",
    imgSize: 36,
    imgClass: "relative drop-shadow-md brightness-0 invert",
  },
  lg: {
    outer:
      "h-[72px] w-[72px] rounded-2xl shadow-lg shadow-purple-500/25",
    inset: "inset-[3px] rounded-[13px]",
    imgSize: 40,
    imgClass: "relative drop-shadow-md brightness-0 invert",
  },
} as const;

export type KrakenMarkTileSize = keyof typeof sizeStyles;

type KrakenMarkTileProps = {
  size: KrakenMarkTileSize;
  className?: string;
  /** Prefer loading early for above-the-fold marks (e.g. nav). */
  priority?: boolean;
};

export function KrakenMarkTile({
  size,
  className,
  priority = false,
}: KrakenMarkTileProps) {
  const s = sizeStyles[size];

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-gradient-to-br from-[#a855f7] via-[#8b5cf6] to-[#ec4899]",
        s.outer,
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute bg-gradient-to-br from-white/25 to-transparent",
          s.inset
        )}
      />
      <Image
        src="/kraken-mark.svg"
        alt=""
        width={s.imgSize}
        height={s.imgSize}
        priority={priority}
        className={cn("relative", s.imgClass)}
      />
    </div>
  );
}
