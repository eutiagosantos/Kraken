"use client";

import { Check, Circle } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariantClasses } from "@/components/ui/Button";
import { useUserMetaApp } from "@/lib/hooks/useUserMetaApp";
import { cn } from "@/lib/utils";

export type MetaSetupChecklistVariant = "settings" | "contas" | "upload";

type MetaSetupChecklistProps = {
  variant: MetaSetupChecklistVariant;
  onConnect?: () => void;
};

function StepRow({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          done ? "bg-semantic-green text-white" : "border border-neutral-border bg-neutral-white text-neutral-gray"
        )}
        aria-hidden
      >
        {done ? <Check className="h-3 w-3" /> : <Circle className="h-2 w-2 fill-current" />}
      </span>
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", done ? "text-neutral-black" : "text-neutral-black")}>{label}</p>
        <p className="mt-0.5 text-xs text-neutral-gray">{detail}</p>
      </div>
    </li>
  );
}

export function MetaSetupChecklist({ variant, onConnect }: MetaSetupChecklistProps) {
  const { configured, hasAccessToken, connectedAccounts, loading } = useUserMetaApp();

  const step1Done = configured;
  const step2Done = hasAccessToken;
  const step3Done = connectedAccounts > 0;
  const setupComplete = step1Done && step2Done && step3Done;

  if (loading) {
    return null;
  }

  if (variant === "settings" && setupComplete) {
    return null;
  }

  if (variant === "contas" && step3Done) {
    return null;
  }

  if (variant === "upload" && step3Done) {
    return null;
  }

  const showTokenCallout = variant === "settings" && configured && !hasAccessToken;

  const containerClass =
    variant === "upload"
      ? "rounded-lg border border-gray-200 bg-gray-50 px-3 py-3"
      : variant === "contas"
        ? "mb-5 rounded-xl border border-dashboard-border bg-dashboard-surface px-4 py-4"
        : "mb-4 rounded-lg border border-dashboard-border bg-dashboard-surface px-4 py-3";

  return (
    <div className={containerClass}>
      {variant !== "upload" ? (
        <p className="text-sm font-semibold text-neutral-black">Configuração Meta</p>
      ) : null}
      <p
        className={cn(
          "text-xs text-neutral-gray",
          variant !== "upload" ? "mt-1" : "text-sm text-gray-600"
        )}
      >
        O App ID identifica a sua app; o token de acesso dá acesso às suas contas de anúncios. São passos
        diferentes.
      </p>

      <ol className={cn("space-y-3", variant === "upload" ? "mt-2" : "mt-4")}>
        <StepRow
          done={step1Done}
          label="Passo 1 — App Meta (App ID + App Secret)"
          detail="Em Configurações, credenciais do Meta for Developers para validar chamadas à API."
        />
        <StepRow
          done={step2Done}
          label="Passo 2 — Token de acesso do utilizador"
          detail="Em Contas Meta, cole um token gerado no Graph API Explorer (não é o App Secret)."
        />
        {variant !== "settings" ? (
          <StepRow
            done={step3Done}
            label="Passo 3 — Contas sincronizadas"
            detail={
              step3Done
                ? `${connectedAccounts} conta(s) ligada(s).`
                : "Após conectar o token, as contas de anúncios aparecem aqui."
            }
          />
        ) : null}
      </ol>

      {showTokenCallout ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <p className="font-medium">App configurado — falta o token de acesso.</p>
          <p className="mt-1 text-xs text-amber-800">
            Guarde o App ID/Secret não importa contas sozinho. Conecte um token em Contas Meta para sincronizar.
          </p>
          <Link
            href="/contas-meta"
            className={cn(buttonVariantClasses.primary, "mt-3 inline-flex px-4 py-2 text-sm")}
          >
            Ir para Contas Meta
          </Link>
        </div>
      ) : null}

      {variant === "contas" && !step3Done ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {onConnect ? (
            <Button type="button" variant="primary" className="px-4 py-2 text-sm" onClick={onConnect}>
              Conectar token de acesso
            </Button>
          ) : null}
          {!step1Done ? (
            <Link
              href="/configuracoes"
              className={cn(buttonVariantClasses.subtle, "inline-flex px-4 py-2 text-sm")}
            >
              Configurar App Meta
            </Link>
          ) : null}
        </div>
      ) : null}

      {variant === "upload" && !step3Done ? (
        <p className="mt-3 text-sm text-gray-600">
          {configured && !hasAccessToken
            ? "App Meta configurado — falta conectar o token de acesso. "
            : "Nenhuma conta Meta ligada. "}
          <Link href="/contas-meta" className="font-medium text-[#7132f5] underline-offset-2 hover:underline">
            Ir para Contas Meta
          </Link>
        </p>
      ) : null}
    </div>
  );
}
