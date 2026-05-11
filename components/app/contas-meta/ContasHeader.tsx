"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function StatPill({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant: "neutral" | "purple" | "yellow" | "red";
}) {
  const styles: Record<typeof variant, string> = {
    neutral: "bg-dashboard-track text-[#686b82]",
    purple: "bg-[rgba(113,50,245,0.12)] text-brand-purple",
    yellow: "bg-semantic-yellow-bg text-semantic-yellow",
    red: "bg-semantic-red-bg text-semantic-red",
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

export function ContasHeader({
  total,
  ativas,
  comProblema,
  desconectadas,
  onConnect,
}: {
  total: number;
  ativas: number;
  comProblema: number;
  desconectadas: number;
  onConnect: () => void;
}) {
  return (
    <header className="mb-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-black md:text-display-md">
            Contas Meta
          </h1>
          <p className="mt-1 text-sm text-neutral-gray">
            Gerencie suas contas do Meta Ads conectadas à plataforma
          </p>
        </div>
        <Button type="button" variant="primary" className="shrink-0 self-start" onClick={onConnect}>
          <Plus className="h-4 w-4" aria-hidden />
          Conectar Nova Conta
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <StatPill label="Total" value={total} variant="neutral" />
        <StatPill label="Ativas" value={ativas} variant="purple" />
        <StatPill label="Com Problema" value={comProblema} variant="yellow" />
        <StatPill label="Desconectadas" value={desconectadas} variant="red" />
      </div>
    </header>
  );
}
