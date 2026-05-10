"use client";

import { cn, avatarBgColorForName, avatarInitials } from "@/lib/utils";

const sizeClass = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-lg font-bold",
} as const;

export function AccountAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof sizeClass;
  className?: string;
}) {
  const bg = avatarBgColorForName(name);
  const initials = avatarInitials(name);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizeClass[size],
        className
      )}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
