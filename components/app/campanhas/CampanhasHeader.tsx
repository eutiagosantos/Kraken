"use client";

import { cn } from "@/lib/utils";

function StatPill({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant: "neutral" | "purple" | "green" | "red";
}) {
  const styles: Record<typeof variant, string> = {
    neutral: "bg-dashboard-track text-[#686b82]",
    purple: "bg-[rgba(113,50,245,0.12)] text-brand-purple",
    green: "bg-[rgba(20,158,97,0.12)] text-semantic-green",
    red: "bg-[rgba(229,62,62,0.10)] text-semantic-red",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-[14px] py-1.5 text-[13px] font-semibold",
        styles[variant]
      )}
    >
      <span className="text-neutral-silver">{label}</span>
      {value}
    </span>
  );
}

export function CampanhasHeader({
  total,
  ativas,
  concluidas,
  comErro,
}: {
  total: number;
  ativas: number;
  concluidas: number;
  comErro: number;
}) {
  return (
    <header className="mb-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-black md:text-display-md">
            Campanhas
          </h1>
          <p className="mt-1 text-sm text-neutral-gray">Gerencie e acompanhe todos os seus uploads</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <StatPill label="Total" value={total} variant="neutral" />
        <StatPill label="Ativas" value={ativas} variant="purple" />
        <StatPill label="Concluídas" value={concluidas} variant="green" />
        <StatPill label="Com Erro" value={comErro} variant="red" />
      </div>
    </header>
  );
}
