"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { mutate } from "swr";

import { useSuccessFeedback } from "@/components/app/ui/SuccessFeedback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWorkspaces } from "@/libs/hooks/useWorkspaces";

export function WorkspaceSection() {
  const { workspaces, loading, refetch } = useWorkspaces();
  const { showSuccess } = useSuccessFeedback();
  const workspace = workspaces[0];

  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !workspace) return;
    setName(workspace.name);
    setInitialName(workspace.name);
  }, [loading, workspace]);

  const trimmed = name.trim();
  const hasChanges = trimmed.length > 0 && trimmed !== initialName.trim();
  const canSave = hasChanges && !saving && !!workspace;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !workspace) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id, name: trimmed }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Não foi possível guardar o nome.");
        return;
      }
      setInitialName(trimmed);
      await mutate("/api/workspaces");
      await refetch();
      showSuccess("Workspace atualizado com sucesso.");
    } catch {
      setError("Erro de rede ao guardar o workspace.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
      <header className="mb-5">
        <h2 className="font-display text-lg font-bold tracking-tight text-neutral-black">Workspace</h2>
        <p className="mt-0.5 text-sm text-neutral-silver">
          Nome do seu espaço de trabalho no Kraken
        </p>
      </header>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-neutral-gray">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
        </p>
      ) : !workspace ? (
        <p className="text-sm text-neutral-gray">Nenhum workspace encontrado.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
          <Input
            id="workspace-name"
            label="Nome do workspace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Meu workspace"
            autoComplete="organization"
            disabled={saving}
          />

          {error ? (
            <p className="text-sm text-semantic-red" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={!canSave}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
