import type { ReactNode } from "react";

interface VariableGroupProps {
  title: string;
  children: ReactNode;
}

export function VariableGroup({ title, children }: VariableGroupProps) {
  return (
    <section className="mb-4">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#686b82]">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}
