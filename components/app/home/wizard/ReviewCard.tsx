import type { ReactNode } from "react";

interface ReviewCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
}

export function ReviewCard({ icon, label, value }: ReviewCardProps) {
  return (
    <div className="rounded-xl border border-[#1e2130] bg-[#141720] p-3">
      <div className="mb-1 text-[#9b72ff]">{icon}</div>
      <p className="text-xs text-[#686b82]">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
