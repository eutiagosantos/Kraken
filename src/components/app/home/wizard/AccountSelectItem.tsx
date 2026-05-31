import { Check } from "lucide-react";
import type { MockAccount } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface AccountSelectItemProps {
  account: MockAccount;
  selected: boolean;
  onToggle: () => void;
}

export function AccountSelectItem({ account, selected, onToggle }: AccountSelectItemProps) {
  const statusIsActive = account.status === "ativo";
  const initial = account.name.slice(0, 1).toUpperCase();
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-[#7132f5] bg-[rgba(113,50,245,0.08)]"
          : "border-gray-300 bg-white hover:border-gray-400"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded border text-xs",
          selected ? "border-[#7132f5] bg-[#7132f5] text-white" : "border-gray-300 text-gray-500"
        )}
      >
        {selected ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
        {initial}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-gray-900">{account.name}</span>
        <span className="block text-xs text-gray-500">{account.id}</span>
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
          statusIsActive ? "bg-[rgba(20,158,97,0.2)] text-[#149e61]" : "bg-[rgba(217,119,6,0.2)] text-[#d97706]"
        )}
      >
        {statusIsActive ? "Ativa" : "Suspensa"}
      </span>
    </button>
  );
}
