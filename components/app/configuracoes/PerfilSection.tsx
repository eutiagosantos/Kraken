"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useSuccessFeedback } from "@/components/app/ui/SuccessFeedback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useKrakenUser } from "@/lib/hooks/useKrakenUser";
import { useSupabase } from "@/lib/hooks/useSupabase";

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PerfilSection() {
  const supabase = useSupabase();
  const { user, displayName, email, loading, refetch } = useKrakenUser();
  const { showSuccess } = useSuccessFeedback();

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialFullName, setInitialFullName] = useState("");

  useEffect(() => {
    if (loading) return;
    setFullName(displayName);
    setInitialFullName(displayName);
  }, [displayName, loading]);

  const initials = useMemo(
    () => initialsFrom(fullName || displayName),
    [fullName, displayName]
  );

  const trimmed = fullName.trim();
  const hasChanges = trimmed.length > 0 && trimmed !== initialFullName.trim();
  const canSave = hasChanges && !saving && !!user?.id;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !user?.id) return;
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", user.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message || "Não foi possível salvar as alterações.");
      return;
    }
    setInitialFullName(trimmed);
    await refetch();
    showSuccess("Perfil atualizado com sucesso.");
  };

  return (
    <section className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
      <header className="mb-5">
        <h2 className="font-display text-lg font-bold tracking-tight text-neutral-black">
          Perfil
        </h2>
        <p className="mt-0.5 text-sm text-neutral-silver">
          Atualize suas informações pessoais
        </p>
      </header>

      <div className="flex items-center gap-4 border-b border-dashboard-border pb-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-base font-bold text-neutral-white ring-2 ring-brand-purple/20">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-black">
            {displayName || "—"}
          </p>
          <p className="truncate text-xs text-dashboard-muted">{email || "—"}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="perfil-nome"
            label="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
            disabled={loading || saving}
          />
          <Input
            id="perfil-email"
            label="E-mail"
            type="email"
            value={email}
            readOnly
            disabled
            labelRight={
              <span className="text-xs font-medium text-dashboard-muted">
                Não editável
              </span>
            }
          />
        </div>

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
    </section>
  );
}
