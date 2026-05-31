import { cn } from "@/lib/utils";

interface BidStrategyCardProps {
  selected: boolean;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}

export function BidStrategyCard({ selected, title, description, badge, onClick }: BidStrategyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        selected ? "border-[#7132f5] bg-[rgba(113,50,245,0.08)]" : "border-gray-300 bg-white hover:border-gray-400"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {badge ? (
          <span className="rounded-full bg-[rgba(113,50,245,0.2)] px-2 py-0.5 text-[10px] font-semibold text-[#9b72ff]">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </button>
  );
}
