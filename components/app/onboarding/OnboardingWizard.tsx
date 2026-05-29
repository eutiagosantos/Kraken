"use client";

import { Check, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { mutate } from "swr";

import { MetaAccessTokenSection } from "@/components/app/meta/MetaAccessTokenSection";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUserMetaApp } from "@/lib/hooks/useUserMetaApp";
import { useWorkspaces } from "@/lib/hooks/useWorkspaces";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Workspace" },
  { id: 2, label: "App Meta" },
  { id: 3, label: "Token" },
  { id: 4, label: "Pronto" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

async function completeOnboarding(): Promise<boolean> {
  const res = await fetch("/api/profile/onboarding", {
    method: "POST",
    credentials: "include",
  });
  return res.ok;
}

function StepIndicator({ current }: { current: StepId }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 sm:gap-0">
      {STEPS.map((step, index) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <li key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  done && "bg-semantic-green text-white",
                  active && "bg-brand-purple text-white",
                  !done && !active && "border border-neutral-border bg-neutral-white text-neutral-gray"
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : step.id}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  active ? "text-neutral-black" : "text-neutral-gray"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <span
                className={cn(
                  "mx-2 hidden h-px w-8 sm:block md:w-12",
                  step.id < current ? "bg-semantic-green" : "bg-neutral-border"
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function WorkspaceStep({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const { workspaces, loading, refetch } = useWorkspaces();
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

  const handleContinue = async () => {
    if (!workspace) return;
    if (hasChanges) {
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
        await mutate("/api/workspaces");
        await refetch();
      } catch {
        setError("Erro de rede ao guardar o workspace.");
        return;
      } finally {
        setSaving(false);
      }
    }
    onContinue();
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-neutral-black md:text-2xl">
        Bem-vindo ao Kraken
      </h2>
      <p className="mt-2 max-w-lg text-sm text-neutral-gray">
        Comece por dar um nome ao seu workspace. É aqui que organiza campanhas, contas Meta e publicações.
      </p>

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-neutral-gray">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
        </p>
      ) : (
        <div className="mt-6 max-w-md">
          <Input
            id="onboarding-workspace-name"
            label="Nome do workspace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Agência XYZ"
            autoComplete="organization"
            disabled={saving || !workspace}
          />
          {error ? (
            <p className="mt-3 text-sm text-semantic-red" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              variant="primary"
              disabled={!trimmed || saving || !workspace}
              onClick={() => void handleContinue()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A guardar…
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaAppStep({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { configured, appId, loading, refetch } = useUserMetaApp();
  const [formAppId, setFormAppId] = useState("");
  const [formAppSecret, setFormAppSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (configured && appId) setFormAppId(appId);
  }, [loading, configured, appId]);

  const canSave =
    !saving && formAppId.trim().length > 0 && formAppSecret.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/meta-app", {
        method: "POST",
        credentials: "include",
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
      onContinue();
    } catch {
      setError("Erro de rede ao guardar credenciais.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-neutral-black md:text-2xl">
        App Meta (Developer)
      </h2>
      <p className="mt-2 max-w-lg text-sm text-neutral-gray">
        Configure o App ID e App Secret do seu app no Meta for Developers. São usados para validar tokens e
        publicar campanhas.
      </p>

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-neutral-gray">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
        </p>
      ) : (
        <>
          {configured && appId ? (
            <p className="mt-4 rounded-lg border border-semantic-green/30 bg-semantic-green-bg px-3 py-2 text-sm text-neutral-black">
              App configurado: <span className="font-mono font-medium">{appId}</span>
            </p>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
            className="mt-6 max-w-md flex flex-col gap-4"
          >
            <Input
              id="onboarding-meta-app-id"
              label="App ID"
              value={formAppId}
              onChange={(e) => setFormAppId(e.target.value)}
              placeholder="123456789012345"
              autoComplete="off"
              required
            />
            <Input
              id="onboarding-meta-app-secret"
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
              <p className="text-sm text-semantic-red" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => void onSkip()}>
                Fazer isso depois
              </Button>
              <div className="flex flex-wrap gap-3">
                {configured ? (
                  <Button type="button" variant="secondary" onClick={() => onContinue()}>
                    Continuar
                  </Button>
                ) : null}
                <Button type="submit" variant="primary" disabled={!canSave && !configured}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A guardar…
                    </>
                  ) : configured ? (
                    "Atualizar e continuar"
                  ) : (
                    "Guardar e continuar"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function TokenStep({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { hasAccessToken, loading } = useUserMetaApp();

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-neutral-black md:text-2xl">
        Token de acesso
      </h2>
      <p className="mt-2 max-w-lg text-sm text-neutral-gray">
        Cole um token do Graph API Explorer para sincronizar as suas contas de anúncios Meta.
      </p>

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-neutral-gray">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
        </p>
      ) : (
        <>
          <div className="mt-6 rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
            <MetaAccessTokenSection onSynced={onContinue} />
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => void onSkip()}>
              Fazer isso depois
            </Button>
            {hasAccessToken ? (
              <Button type="button" variant="primary" onClick={() => onContinue()}>
                Continuar
              </Button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function DoneStep({ onFinish, finishing }: { onFinish: () => void; finishing: boolean }) {
  const { configured, hasAccessToken, connectedAccounts } = useUserMetaApp();

  const checklist = useMemo(
    () => [
      { label: "Workspace configurado", done: true },
      { label: "App Meta (App ID + Secret)", done: configured },
      { label: "Token de acesso", done: hasAccessToken },
      { label: "Contas sincronizadas", done: connectedAccounts > 0 },
    ],
    [configured, hasAccessToken, connectedAccounts]
  );

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple-subtle">
        <Sparkles className="h-8 w-8 text-brand-purple" aria-hidden />
      </div>
      <h2 className="mt-6 font-display text-xl font-bold text-neutral-black md:text-2xl">
        Tudo pronto!
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-gray">
        O seu Kraken está configurado. Pode começar a publicar campanhas ou completar os passos em falta
        depois em Configurações.
      </p>

      <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                item.done ? "bg-semantic-green text-white" : "border border-neutral-border text-neutral-gray"
              )}
            >
              {item.done ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
            </span>
            <span className="text-sm text-neutral-black">{item.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex justify-center">
        <Button type="button" variant="primary" disabled={finishing} onClick={() => void onFinish()}>
          {finishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A concluir…
            </>
          ) : (
            "Ir para o dashboard"
          )}
        </Button>
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>(1);
  const [finishing, setFinishing] = useState(false);

  const finishAndRedirect = async () => {
    setFinishing(true);
    try {
      const ok = await completeOnboarding();
      if (ok) {
        router.push("/home");
        router.refresh();
      }
    } finally {
      setFinishing(false);
    }
  };

  const skipToHome = async () => {
    setFinishing(true);
    try {
      const ok = await completeOnboarding();
      if (ok) {
        router.push("/home");
        router.refresh();
      }
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 md:py-12">
      <StepIndicator current={step} />

      <div className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle md:p-8">
        {step === 1 ? <WorkspaceStep onContinue={() => setStep(2)} /> : null}
        {step === 2 ? (
          <MetaAppStep onContinue={() => setStep(3)} onSkip={() => void skipToHome()} />
        ) : null}
        {step === 3 ? (
          <TokenStep onContinue={() => setStep(4)} onSkip={() => void skipToHome()} />
        ) : null}
        {step === 4 ? <DoneStep onFinish={() => void finishAndRedirect()} finishing={finishing} /> : null}
      </div>
    </div>
  );
}
