"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AccountAvatar } from "@/components/app/contas-meta/AccountAvatar";
import { cn } from "@/lib/utils";

type FbPageRow = { id: string; name: string; pictureUrl?: string };

export function FacebookPagesPanel({
  onConnect,
  active,
  reloadKey = 0,
}: {
  onConnect: () => void;
  /** Quando falso, não pede à API (aba inativa). */
  active: boolean;
  /** Incrementar após reconectar Meta para voltar a pedir a lista. */
  reloadKey?: number;
}) {
  const [pages, setPages] = useState<FbPageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wizard/pages", { credentials: "include" });
      const raw = (await res.json().catch(() => ({}))) as { error?: string; data?: FbPageRow[] };
      if (!res.ok) {
        throw new Error(typeof raw.error === "string" ? raw.error : `Pedido falhou (${res.status})`);
      }
      setPages(Array.isArray(raw.data) ? raw.data : []);
    } catch (e) {
      setPages([]);
      setError(e instanceof Error ? e.message : "Não foi possível carregar as páginas.");
    } finally {
      setLoading(false);
      setLoadedOnce(true);
    }
  }, []);

  useLayoutEffect(() => {
    if (active) setLoading(true);
  }, [active, reloadKey]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, reloadKey, load]);

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  if (!active) {
    return null;
  }

  if (loading || !loadedOnce) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 py-16 text-sm text-neutral-silver">
        <Loader2 className="h-10 w-10 shrink-0 animate-spin text-brand-purple" aria-hidden />
        <p>A carregar páginas Facebook…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashboard-border bg-white px-6 py-16 text-center">
        <p className="max-w-md text-sm text-semantic-red">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="subtle" onClick={() => void load()}>
            Tentar novamente
          </Button>
          <Button type="button" variant="primary" onClick={onConnect}>
            Conectar Meta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-gray">
        Páginas que a sua identidade Meta gere (Graph API <code className="rounded bg-dashboard-track px-1 py-0.5 text-xs">me/accounts</code>
        ). As mesmas opções aparecem no assistente de publicação ao escolher a Página do criativo.
      </p>

      {pages.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-dashboard-border bg-dashboard-surface/50 px-6 py-14 text-center text-sm text-neutral-gray">
          <p>Nenhuma página encontrada com o token atual.</p>
          <p className="max-w-md text-xs text-neutral-silver">
            Confirme permissões <span className="font-medium">pages_show_list</span> e que gere pelo menos uma
            Página com a conta Facebook ligada ao Kraken.
          </p>
          <Button type="button" variant="primary" className="mt-1" onClick={onConnect}>
            Conectar ou reconectar Meta
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {pages.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-dashboard-border bg-white p-4 shadow-sm"
            >
              {p.pictureUrl ? (
                <img
                  src={p.pictureUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <AccountAvatar name={p.name} size="md" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-neutral-black">{p.name}</p>
                <p className="truncate font-mono text-xs text-neutral-silver">{p.id}</p>
              </div>
              <button
                type="button"
                onClick={() => void copyId(p.id)}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashboard-border text-neutral-silver transition-colors hover:bg-dashboard-track hover:text-neutral-black",
                  copiedId === p.id && "border-semantic-green/40 text-semantic-green"
                )}
                title="Copiar ID da página"
                aria-label={`Copiar ID ${p.id}`}
              >
                {copiedId === p.id ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
