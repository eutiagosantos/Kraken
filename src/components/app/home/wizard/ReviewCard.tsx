import type { ReactNode } from "react";

interface ReviewCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
}

export function ReviewCard({ icon, label, value }: ReviewCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-1 text-[#9b72ff]">{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
