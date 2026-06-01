"use client";

import { AlertTriangle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { mutate } from "swr";

import { Button } from "@/components/ui/Button";
import { useUserMetaApp } from "@/libs/hooks/useUserMetaApp";
import { REQUIRED_TOKEN_SCOPES } from "@/libs/meta/required-token-scopes";
import { cn } from "@/libs/utils";

export const META_ACCESS_TOKEN_SETTINGS_HREF = "/configuracoes#meta-access-token";

type MetaAccessTokenSectionProps = {
  onSynced?: () => void;
};

export function MetaAccessTokenSection({ onSynced }: MetaAccessTokenSectionProps) {
  const { hasAccessToken, connectedAccounts, refetch } = useUserMetaApp();

  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [missingScopes, setMissingScopes] = useState<string[]>([]);
  const [previewAccounts, setPreviewAccounts] = useState<
    { id: string; name: string; account_status?: number }[] | null
  >(null);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const resetValidation = () => {
    setTokenValid(null);
    setPreviewAccounts(null);
    setInspectError(null);
    setMissingScopes([]);
    setSyncError(null);
  };

  const validateToken = async () => {
    setValidating(true);
    resetValidation();
    try {
      const res = await fetch("/api/contas-meta", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inspect_token", token: token.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        accounts?: { id: string; name: string; account_status?: number }[];
        missingScopes?: string[];
      };
      if (!res.ok) {
        setTokenValid(false);
        setInspectError(json.error ?? "Não foi possível validar o token.");
        return;
      }
      const accounts = json.accounts ?? [];
      if (accounts.length === 0) {
        setTokenValid(false);
        setInspectError("Nenhuma conta de anúncios encontrada para este token.");
        return;
      }
      setPreviewAccounts(accounts);
      setMissingScopes(json.missingScopes ?? []);
      setTokenValid(true);
    } catch {
      setTokenValid(false);
      setInspectError("Falha de rede ao validar o token.");
    } finally {
      setValidating(false);
    }
  };

  const handleSync = async () => {
    setConnecting(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/contas-meta", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_with_token", token: token.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSyncError(json.error ?? "Falha ao sincronizar contas.");
        return;
      }
      setToken("");
      resetValidation();
      await refetch();
      await mutate("/api/contas-meta");
      await Promise.resolve(onSynced?.());
    } catch {
      setSyncError("Falha de rede ao sincronizar contas.");
    } finally {
      setConnecting(false);
    }
  };

  const canSync =
    tokenValid === true &&
    missingScopes.length === 0 &&
    Boolean(previewAccounts?.length) &&
    !connecting &&
    !validating;

  return (
    <section id="meta-access-token" className="scroll-mt-24 border-t border-neutral-border pt-6">
      <header className="mb-4">
        <h3 className="font-display text-base font-bold text-neutral-black">Token de acesso</h3>
        <p className="mt-1 text-sm text-neutral-gray">
          Token do seu utilizador Facebook — não confundir com o App Secret. Gere-o no Graph API Explorer com o
          mesmo App ID configurado acima.
        </p>
        {hasAccessToken ? (
          <p className="mt-2 inline-flex rounded-lg border border-semantic-green/30 bg-semantic-green-bg px-3 py-1.5 text-sm font-medium text-semantic-green">
            Token guardado · {connectedAccounts} conta(s) sincronizada(s)
          </p>
        ) : null}
      </header>

      <div className="rounded-lg border border-dashboard-border bg-dashboard-base px-4 py-3 text-sm text-neutral-black">
        <p>
          Acesse o{" "}
          <a
            href="https://developers.facebook.com/tools/explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-purple underline"
          >
            Meta Graph API Explorer
          </a>{" "}
          e gere um token com as permissões necessárias (ver lista abaixo).
        </p>
      </div>

      <div className="mt-4 max-w-md">
        <label htmlFor="meta-access-token-input" className="mb-1.5 block text-sm font-semibold text-neutral-black">
          Token de acesso
        </label>
        <div className="relative">
          <input
            id="meta-access-token-input"
            type={showToken ? "text" : "password"}
            placeholder="EAAxxxxxxxxxxxxxxxxx..."
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              resetValidation();
            }}
            className="w-full rounded-lg border border-neutral-border bg-neutral-white py-2.5 pl-3 pr-11 text-base outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-gray hover:bg-dashboard-sidebar-ghost"
            aria-label={showToken ? "Ocultar token" : "Mostrar token"}
            onClick={() => setShowToken((v) => !v)}
          >
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {validating ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-neutral-gray">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          A validar token…
        </p>
      ) : null}

      {tokenValid === true && previewAccounts?.length ? (
        <div className="mt-3 flex max-w-md flex-col gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-semantic-green">
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {previewAccounts.length === 1
              ? `Token válido — conta: ${previewAccounts[0].name || previewAccounts[0].id}`
              : `Token válido — ${previewAccounts.length} contas identificadas.`}
          </p>
          {missingScopes.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm">
              <p className="flex items-center gap-2 font-medium text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                Permissões em falta — regenere o token com:
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5 pl-6">
                {missingScopes.map((s) => (
                  <li key={s}>
                    <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono text-amber-800">{s}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {tokenValid === false ? (
        <p className="mt-3 flex flex-col gap-1 text-sm font-medium text-semantic-red">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            Token inválido ou sem acesso às contas de anúncios.
          </span>
          {inspectError ? (
            <span className="pl-6 text-xs font-normal text-neutral-gray">{inspectError}</span>
          ) : null}
        </p>
      ) : null}

      {syncError ? (
        <p className="mt-3 text-sm text-semantic-red" role="alert">
          {syncError}
        </p>
      ) : null}

      <div className="mt-4 rounded-lg border border-dashboard-border bg-dashboard-base px-4 py-3 text-sm">
        <p className="font-semibold text-neutral-black">Permissões necessárias (Graph)</p>
        <ul className="mt-2 space-y-1 text-neutral-gray">
          {REQUIRED_TOKEN_SCOPES.map((scope) => {
            const ok = tokenValid !== true || !missingScopes.includes(scope);
            return (
              <li key={scope} className={cn(tokenValid === true && !ok && "font-medium text-semantic-red")}>
                <code className="rounded bg-neutral-white px-1 py-0.5 text-xs font-mono">{scope}</code>
                {tokenValid === true ? (ok ? " ✓" : " — em falta no token") : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="subtle"
          onClick={() => void validateToken()}
          disabled={!token.trim() || validating || connecting}
        >
          {validating ? "A validar…" : "Validar token"}
        </Button>
        <Button type="button" variant="primary" onClick={() => void handleSync()} disabled={!canSync}>
          {connecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              A sincronizar…
            </>
          ) : (
            "Guardar e sincronizar contas"
          )}
        </Button>
      </div>
    </section>
  );
}
