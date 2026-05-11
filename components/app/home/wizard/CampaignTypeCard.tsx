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
        selected ? "border-[#7132f5] bg-[rgba(113,50,245,0.1)]" : "border-[#1e2130] bg-[#141720] hover:border-[#2a2f45]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[#9b72ff]">{icon}</span>
        {badge}
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#686b82]">{description}</p>
    </button>
  );
}
