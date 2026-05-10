"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function InfoRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashboard-border py-3 text-sm last:border-0">
      <span className="shrink-0 text-neutral-gray">{label}</span>
      <div className="flex min-w-0 items-center gap-2 text-right font-medium text-neutral-black">
        <span className="truncate">{value}</span>
        {copyable ? (
          <button
            type="button"
            className="shrink-0 rounded p-1 text-neutral-gray hover:bg-dashboard-sidebar-ghost hover:text-brand-purple"
            aria-label="Copiar"
            onClick={async () => {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">{copied ? "Copiado" : "Copiar"}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
