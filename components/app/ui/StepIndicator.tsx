"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  "Selecionar Contas Meta",
  "Upload dos Criativos",
  "Configurar Campanhas",
  "Revisar e Publicar",
];

export function StepIndicator({
  currentStep,
}: {
  /** 1-based */
  currentStep: number;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-1 md:gap-2">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const done = stepNum < currentStep;
          const active = stepNum === currentStep;

          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors duration-300",
                      stepNum <= currentStep ? "bg-brand-purple" : "bg-dashboard-border"
                    )}
                  />
                ) : (
                  <div className="flex-1" />
                )}
                <div
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300",
                    done &&
                      "border-semantic-green bg-semantic-green text-neutral-white",
                    active &&
                      !done &&
                      "border-brand-purple bg-brand-purple text-neutral-white",
                    !active &&
                      !done &&
                      "border-dashboard-border-strong bg-dashboard-surface text-dashboard-muted"
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : stepNum}
                </div>
                {index < steps.length - 1 ? (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors duration-300",
                      stepNum < currentStep ? "bg-brand-purple" : "bg-dashboard-border"
                    )}
                  />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
              <p
                className={cn(
                  "mt-2 hidden max-w-[140px] text-center text-xs font-medium leading-snug sm:block",
                  active ? "font-bold text-neutral-black" : "text-neutral-gray"
                )}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-neutral-black sm:hidden">
        {steps[currentStep - 1]}
      </p>
    </div>
  );
}
