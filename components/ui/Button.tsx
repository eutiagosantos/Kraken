import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outlined" | "subtle" | "white" | "secondary";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-purple text-neutral-white hover:bg-brand-purple-deep shadow-subtle rounded-btn px-4 py-[13px] font-semibold text-base transition-colors",
  outlined:
    "border border-brand-purple-dark bg-neutral-white text-brand-purple-dark hover:bg-brand-purple-subtle rounded-btn px-4 py-[13px] font-semibold text-base transition-colors",
  subtle:
    "bg-brand-purple-subtle text-brand-purple hover:bg-brand-purple/15 rounded-btn px-4 py-[13px] font-semibold text-base transition-colors",
  white:
    "bg-neutral-white text-neutral-black rounded-[10px] px-4 py-[13px] font-semibold text-base shadow-subtle hover:shadow-micro transition-shadow",
  secondary:
    "rounded-btn bg-[rgba(148,151,169,0.08)] px-4 py-[13px] text-base font-semibold text-neutral-black transition-colors hover:bg-[rgba(148,151,169,0.12)]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50",
        buttonVariantClasses[variant],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
