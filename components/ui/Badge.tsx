import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "neutral" | "purple";

const variants: Record<BadgeVariant, string> = {
  success:
    "rounded-[6px] bg-semantic-green-bg px-2.5 py-1 text-sm font-medium text-semantic-green-dark",
  neutral:
    "rounded-badge bg-[rgba(104,107,130,0.12)] px-2.5 py-1 text-sm font-medium text-[#484b5e]",
  purple:
    "rounded-badge bg-brand-purple-subtle px-2.5 py-1 text-sm font-medium text-brand-purple",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "purple", ...props }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", variants[variant], className)} {...props} />
  );
}
