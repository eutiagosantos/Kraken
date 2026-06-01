"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { MetaAccessTokenSection } from "@/components/app/meta/MetaAccessTokenSection";
import { useSuccessFeedback } from "@/components/app/ui/SuccessFeedback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUserMetaApp } from "@/libs/hooks/useUserMetaApp";

export function MetaAppPanel() {
  const { configured, appId, loading, refetch } = useUserMetaApp();
  const { showSuccess } = useSuccessFeedback();

  const [formAppId, setFormAppId] = useState("");
  const [formAppSecret, setFormAppSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (configured && appId) {
      setFormAppId(appId);
    }
  }, [loading, configured, appId]);

  const canSave =
    !saving &&
    formAppId.trim().length > 0 &&
    formAppSecret.trim().length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/meta-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: formAppId.trim(),
          appSecret: formAppSecret.trim(),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error || "Não foi possível guardar as credenciais.");
        return;
      }
      setFormAppSecret("");
      await refetch();
      showSuccess("App Meta configurado com sucesso.");
    } catch {
      setError("Erro de rede ao guardar credenciais.");
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async () => {
    if (!configured || removing) return;
    if (!window.confirm("Remover o App Meta configurado? O servidor voltará a usar as credenciais globais, se existirem.")) {
      return;
    }
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/meta-app", { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error || "Não foi possível remover as credenciais.");
        return;
      }
      setFormAppId("");
      setFormAppSecret("");
      await refetch();
      showSuccess("App Meta removido.");
    } catch {
      setError("Erro de rede ao remover credenciais.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <section className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
      <header className="mb-5">
        <h2 className="font-display text-lg font-bold tracking-tight text-neutral-black">
          App Meta (Developer)
        </h2>
        <p className="mt-0.5 text-sm text-neutral-silver">
          Configure aqui o app Meta (App ID + App Secret) e o token de acesso para sincronizar contas de anúncios,
          páginas e publicação.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-gray">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          A carregar…
        </div>
      ) : (
        <>
          {configured && appId ? (
            <p className="mb-4 rounded-lg border border-dashboard-border bg-dashboard-surface px-3 py-2 text-sm text-neutral-black">
              App configurado: <span className="font-mono font-medium">{appId}</span>
            </p>
          ) : (
            <p className="mb-4 text-sm text-neutral-gray">
              Nenhum app configurado — serão usadas as variáveis{" "}
              <code className="text-xs">META_APP_ID</code> /{" "}
              <code className="text-xs">META_APP_SECRET</code> do servidor, se definidas.
            </p>
          )}

          <div>
            <h3 className="font-display text-base font-bold text-neutral-black">Credenciais do app</h3>
            <p className="mt-1 text-sm text-neutral-gray">
              App ID e App Secret autenticam chamadas à API (
              <code className="text-xs">appsecret_proof</code> e validação de tokens).
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-4 flex max-w-md flex-col gap-4">
            <Input
              id="meta-app-id"
              label="App ID"
              value={formAppId}
              onChange={(e) => setFormAppId(e.target.value)}
              placeholder="123456789012345"
              autoComplete="off"
              required
            />
            <Input
              id="meta-app-secret"
              label="App Secret"
              type={showSecret ? "text" : "password"}
              value={formAppSecret}
              onChange={(e) => setFormAppSecret(e.target.value)}
              placeholder={configured ? "Novo secret (substitui o anterior)" : "App Secret"}
              autoComplete="new-password"
              suffix={
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  aria-label={showSecret ? "Ocultar secret" : "Mostrar secret"}
                  className="rounded-md p-1.5 text-dashboard-muted hover:text-neutral-black"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!canSave}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    A guardar…
                  </>
                ) : (
                  "Guardar credenciais"
                )}
              </Button>
              {configured ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={removing}
                  onClick={() => void onRemove()}
                >
                  {removing ? "A remover…" : "Remover app"}
                </Button>
              ) : null}
            </div>
          </form>

          <MetaAccessTokenSection onSynced={() => showSuccess("Contas Meta sincronizadas com sucesso.")} />
        </>
      )}
    </section>
  );
}
