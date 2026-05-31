"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  formatBrlInputValue,
  formatBrlTypingDisplay,
  parseBrlToNumber,
  sanitizeBrlTyping,
} from "@/lib/brl-money-input";

export interface CurrencyInputBrlProps {
  id: string;
  label?: string;
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  /** When true, empty field maps to `undefined` on blur / when cleared. */
  allowEmpty?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  "aria-describedby"?: string;
}

function clamp(n: number, min?: number, max?: number): number {
  let x = n;
  if (min !== undefined && x < min) x = min;
  if (max !== undefined && x > max) x = max;
  return x;
}

export function CurrencyInputBrl({
  id,
  label,
  value,
  onValueChange,
  min,
  max,
  allowEmpty = false,
  disabled,
  className,
  inputClassName,
  required,
  "aria-describedby": ariaDescribedBy,
}: CurrencyInputBrlProps) {
  const [text, setText] = useState(() =>
    value === undefined && allowEmpty ? "" : formatBrlInputValue(value ?? 0)
  );
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    if (value === undefined && allowEmpty) {
      setText("");
      return;
    }
    setText(formatBrlInputValue(value ?? 0));
  }, [value, allowEmpty]);

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-neutral-black">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-gray">
          R$
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          required={required}
          aria-describedby={ariaDescribedBy}
          value={text}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
            const parsed = parseBrlToNumber(text);
            if (parsed === undefined || !Number.isFinite(parsed)) {
              if (allowEmpty) {
                setText("");
                onValueChange(undefined);
              } else {
                const fallback = min ?? 0;
                onValueChange(fallback);
                setText(formatBrlInputValue(fallback));
              }
              return;
            }
            const c = clamp(parsed, min, max);
            onValueChange(c);
            setText(formatBrlInputValue(c));
          }}
          onChange={(e) => {
            const sanitized = sanitizeBrlTyping(e.target.value);
            const display = formatBrlTypingDisplay(sanitized);
            setText(display);
            const parsed = parseBrlToNumber(sanitized);
            if (parsed === undefined) {
              if (allowEmpty && sanitized.trim() === "") {
                onValueChange(undefined);
              }
              return;
            }
            onValueChange(parsed);
          }}
          className={cn(
            "w-full rounded-lg border border-neutral-border bg-neutral-white py-2.5 pl-10 pr-3 font-ui text-base tabular-nums text-neutral-black outline-none transition-[box-shadow,border-color]",
            "focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25",
            inputClassName
          )}
        />
      </div>
    </div>
  );
}
