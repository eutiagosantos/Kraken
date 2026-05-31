import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: "Criativos & Contas" },
  { number: 2, label: "Configuração" },
  { number: 3, label: "Público & Revisão" },
] as const;

export function WizardStepIndicator({ currentStep }: WizardStepIndicatorProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-7 py-5">
      <ol className="flex items-center gap-3">
        {steps.map((step, index) => {
          const isDone = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const hasNext = index < steps.length - 1;
          return (
            <li key={step.number} className="flex flex-1 items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                  isDone && "border-[#149e61] bg-[rgba(20,158,97,0.12)] text-[#149e61]",
                  isCurrent && "border-[#7132f5] bg-[#7132f5] text-white",
                  !isDone && !isCurrent && "border-gray-300 bg-gray-100 text-gray-500"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : step.number}
              </span>
              <span className={cn("text-sm", isCurrent ? "font-semibold text-gray-900" : "text-gray-500")}>
                {step.label}
              </span>
              {hasNext ? (
                <span
                  className={cn(
                    "ml-2 h-[2px] flex-1 rounded-full",
                    currentStep > step.number ? "bg-gradient-to-r from-[#149e61] to-[#7132f5]" : "bg-gray-200"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </header>
  );
}
