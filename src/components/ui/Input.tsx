import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  /** When true, label is visible only to screen readers (placeholder-driven UI). */
  labelSrOnly?: boolean;
  labelRight?: ReactNode;
  suffix?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, labelSrOnly, labelRight, suffix, error, className, ...props }, ref) => (
    <div className="w-full">
      <div
        className={cn(
          "mb-1.5 flex items-center justify-between gap-3",
          labelSrOnly && "sr-only"
        )}
      >
        <label htmlFor={id} className="text-sm font-semibold text-neutral-black">
          {label}
        </label>
        {labelRight ? <span className="shrink-0">{labelRight}</span> : null}
      </div>
      <div className={cn("relative", suffix && "flex items-center")}>
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full rounded-lg border border-neutral-border bg-neutral-white px-3 py-2.5 font-ui text-base text-neutral-black outline-none transition-[box-shadow,border-color]",
            "placeholder:text-neutral-silver",
            "focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/25",
            suffix && "pr-11",
            className
          )}
          {...props}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 [&_button]:pointer-events-auto [&_a]:pointer-events-auto">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
);

Input.displayName = "Input";
