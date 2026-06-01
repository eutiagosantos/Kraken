"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { messageForSignInAuthError } from "@/libs/auth/supabase-auth-error-message";
import { useSupabase } from "@/libs/hooks/useSupabase";
import { cn } from "@/libs/utils";

export function KrakenLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();

  const nextParam = searchParams.get("next") ?? "/home";
  const safeNext = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/home";
  const registeredNotice =
    searchParams.get("registered") === "1"
      ? "Conta criada com sucesso. Entre com o seu e-mail e senha."
      : null;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ text: string; tone: "success" | "error" } | null>(
    registeredNotice ? { text: registeredNotice, tone: "success" } : null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("identifier") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    const next: Record<string, string> = {};
    if (!email) next.identifier = "Informe seu e-mail.";
    if (!password) next.password = "Informe sua senha.";

    setErrors(next);
    setNotice(null);

    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) {
      setNotice({ text: messageForSignInAuthError(error), tone: "error" });
      return;
    }

    router.push(safeNext);
    router.refresh();
  }

  const eyeButtonClass =
    "rounded-md p-1.5 text-neutral-gray transition-colors hover:bg-black/[0.06] hover:text-neutral-black";

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {notice ? (
        <p
          className={cn(
            "rounded-lg border px-3 py-2.5 text-sm",
            notice.tone === "success" &&
              "border-neutral-border bg-brand-purple-subtle text-brand-purple-deep",
            notice.tone === "error" && "border-red-200 bg-red-50 text-red-900"
          )}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      ) : null}

      <Input
        id="login-identifier"
        name="identifier"
        type="email"
        autoComplete="email"
        label="E-mail"
        placeholder="voce@empresa.com"
        error={errors.identifier}
      />

      <Input
        id="login-password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        label="Senha"
        placeholder="Sua senha"
        error={errors.password}
        suffix={
          <button
            type="button"
            className={eyeButtonClass}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <Eye className="h-[18px] w-[18px]" aria-hidden />
            )}
          </button>
        }
      />

      <div className="flex justify-end pt-0.5">
        <Link
          href="/cadastro"
          className="text-sm font-semibold text-brand-purple-dark underline-offset-2 hover:underline"
        >
          Criar conta
        </Link>
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? "Entrando…" : "Entrar"}
      </Button>

      <p className="pt-2 text-center text-sm leading-relaxed text-neutral-gray">
        Precisa de ajuda?{" "}
        <a
          href="mailto:support@kraken.com"
          className="font-semibold text-brand-purple-dark underline-offset-2 hover:underline"
        >
          Fale conosco
        </a>
      </p>
    </form>
  );
}
