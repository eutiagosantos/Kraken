interface VariableChipProps {
  label: string;
  value: string;
  color?: string;
  onClick: (value: string, label: string, color?: string) => void;
}

export function VariableChip({ label, value, color = "#7132f5", onClick }: VariableChipProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(value, label, color)}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80"
      style={{ backgroundColor: `${color}29` }}
      title={value}
    >
      {label}
    </button>
  );
}
