import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StepFooterProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function StepFooter({ left, right, className }: StepFooterProps) {
  return (
    <footer
      className={cn(
        "flex items-center justify-between border-t border-[#1e2130] bg-[#141720] px-6 py-4",
        className
      )}
    >
      <div>{left}</div>
      <div>{right}</div>
    </footer>
  );
}
