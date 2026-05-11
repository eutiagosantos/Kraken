import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CampaignTypeCardProps {
  selected: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  badge?: ReactNode;
  onClick: () => void;
}

export function CampaignTypeCard({
  selected,
  icon,
  title,
  description,
  badge,
  onClick,
}: CampaignTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        selected ? "border-[#7132f5] bg-[rgba(113,50,245,0.1)]" : "border-gray-300 bg-white hover:border-gray-400"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[#9b72ff]">{icon}</span>
        {badge}
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
    </button>
  );
}
