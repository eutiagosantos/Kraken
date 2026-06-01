"use client";

import { Check, Circle } from "lucide-react";
import Link from "next/link";

import { META_ACCESS_TOKEN_SETTINGS_HREF } from "@/components/app/meta/MetaAccessTokenSection";
import { buttonVariantClasses } from "@/components/ui/Button";
import { useUserMetaApp } from "@/libs/hooks/useUserMetaApp";
import { cn } from "@/libs/utils";

export type MetaSetupChecklistVariant = "contas" | "upload";

type MetaSetupChecklistProps = {
  variant: MetaSetupChecklistVariant;
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
        <p className="text-sm font-medium text-neutral-black">{label}</p>
        <p className="mt-0.5 text-xs text-neutral-gray">{detail}</p>
      </div>
    </li>
  );
}

export function MetaSetupChecklist({ variant }: MetaSetupChecklistProps) {
  const { configured, hasAccessToken, connectedAccounts, loading } = useUserMetaApp();

  const step1Done = configured;
  const step2Done = hasAccessToken;
  const step3Done = connectedAccounts > 0;

  if (loading || step3Done) {
    return null;
  }

  const containerClass =
    variant === "upload"
      ? "rounded-lg border border-gray-200 bg-gray-50 px-3 py-3"
      : "mb-5 rounded-xl border border-dashboard-border bg-dashboard-surface px-4 py-4";

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
        Configure App ID, App Secret e token de acesso num só lugar:{" "}
        <strong className="font-medium text-neutral-black">Configurações → App Meta</strong>.
      </p>

      <ol className={cn("space-y-3", variant === "upload" ? "mt-2" : "mt-4")}>
        <StepRow
          done={step1Done}
          label="Passo 1 — App Meta (App ID + App Secret)"
          detail="Credenciais do Meta for Developers em Configurações."
        />
        <StepRow
          done={step2Done}
          label="Passo 2 — Token de acesso do utilizador"
          detail="Na mesma página, cole um token do Graph API Explorer (não é o App Secret)."
        />
        <StepRow
          done={step3Done}
          label="Passo 3 — Contas sincronizadas"
          detail={
            step3Done
              ? `${connectedAccounts} conta(s) ligada(s).`
              : "Após guardar o token, as contas de anúncios aparecem aqui."
          }
        />
      </ol>

      <div className={cn("flex flex-wrap gap-3", variant === "upload" ? "mt-3" : "mt-4")}>
        <Link
          href={META_ACCESS_TOKEN_SETTINGS_HREF}
          className={cn(buttonVariantClasses.primary, "inline-flex px-4 py-2 text-sm")}
        >
          {configured && !hasAccessToken ? "Configurar token" : "Ir para Configurações"}
        </Link>
      </div>

      {variant === "upload" && configured && !hasAccessToken ? (
        <p className="mt-2 text-xs text-gray-500">App Meta configurado — falta guardar o token de acesso.</p>
      ) : null}
    </div>
  );
}
