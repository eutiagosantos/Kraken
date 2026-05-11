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
        selected ? "border-[#7132f5] bg-[rgba(113,50,245,0.08)]" : "border-[#1e2130] bg-[#141720] hover:border-[#2a2f45]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{title}</p>
        {badge ? (
          <span className="rounded-full bg-[rgba(113,50,245,0.2)] px-2 py-0.5 text-[10px] font-semibold text-[#9b72ff]">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-[#686b82]">{description}</p>
    </button>
  );
}
