interface SummaryRowProps {
  label: string;
  value: string;
}

export function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#1e2130] py-2 last:border-b-0">
      <span className="text-sm text-[#686b82]">{label}</span>
      <span className="text-right text-sm font-medium text-white">{value}</span>
    </div>
  );
}
