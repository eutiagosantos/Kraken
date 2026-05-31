"use client";

import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { CreativeLibraryStatus, MockCreativeLibraryItem } from "@/lib/mock-data";

function statusBadge(status: CreativeLibraryStatus) {
  switch (status) {
    case "aprovado":
      return (
        <Badge variant="success" className="font-ui text-xs font-semibold">
          Aprovado
        </Badge>
      );
    case "pendente":
      return (
        <span className="inline-flex rounded-[6px] bg-[rgba(217,119,6,0.12)] px-2.5 py-1 font-ui text-xs font-semibold text-[#b45309]">
          Pendente
        </span>
      );
    case "rejeitado":
      return (
        <Badge variant="neutral" className="bg-semantic-red-bg font-ui text-xs font-semibold text-semantic-red">
          Rejeitado
        </Badge>
      );
    default:
      return null;
  }
}

type Props = {
  items?: MockCreativeLibraryItem[];
};

export function CreativesSummary({ items = [] }: Props) {
  return (
    <section className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
      <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-neutral-black">Criativos na biblioteca</h3>
      <p className="mt-1 font-ui text-sm text-neutral-silver">Status e uso em campanhas</p>
      {items.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-silver">Sem criativos na biblioteca.</p>
      ) : (
      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-[12px] border border-neutral-border bg-[rgba(148,151,169,0.08)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(133,91,251,0.12)] text-brand-purple">
                  <ImageIcon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-ui text-base font-semibold text-neutral-black">{item.name}</p>
                  <p className="mt-0.5 font-ui text-xs text-neutral-silver">
                    {item.id} · {item.format}
                  </p>
                </div>
              </div>
              {statusBadge(item.status)}
            </div>
            <p className="mt-3 font-ui text-xs text-neutral-gray">
              Em <span className="font-semibold text-brand-purple">{item.campaignsCount}</span> campanha
              {item.campaignsCount === 1 ? "" : "s"}
            </p>
            <Link
              href="/upload"
              className="mt-2 inline-flex font-ui text-sm font-semibold text-brand-purple transition-colors hover:text-brand-purple-dark"
            >
              Usar em novo upload
            </Link>
          </li>
        ))}
      </ul>
      )}
    </section>
  );
}
