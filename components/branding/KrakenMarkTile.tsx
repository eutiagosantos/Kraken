import Image from "next/image";
import { cn } from "@/lib/utils";

/** Intrinsic dimensions of `public/kraken-logo.png` (square wordmark). */
const LOGO_SRC = "/kraken-logo.png" as const;
const LOGO_WIDTH = 500;
const LOGO_HEIGHT = 500;

const sizeStyles = {
  xs: {
    outer: "h-16 w-16 rounded-2xl",
    pad: "p-2",
  },
  sm: {
    outer: "h-16 w-16 rounded-2xl",
    pad: "p-1.5",
  },
  /** Marketing home nav — larger than compact headers (login, etc.). */
  landing: {
    outer: "h-20 w-20 rounded-2xl sm:h-[5.5rem] sm:w-[5.5rem]",
    pad: "p-1.5",
  },
  /** Sidebar workspace trigger — row stays readable with gap-2 + py-2. */
  sidebar: {
    outer: "h-14 w-14 rounded-2xl",
    pad: "p-1.5",
  },
  md: {
    outer: "h-36 w-36 rounded-2xl xl:h-40 xl:w-40",
    pad: "p-1",
  },
  /** Login / cadastro hero mark — scales up on wide viewports, caps on narrow. */
  lg: {
    outer: "aspect-square w-[clamp(9.5rem,48vw,12rem)] max-w-full rounded-3xl",
    pad: "p-1",
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
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-transparent",
        s.outer,
        className
      )}
    >
      <Image
        src={LOGO_SRC}
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        className={cn("h-full w-full object-contain", s.pad)}
      />
    </div>
  );
}
