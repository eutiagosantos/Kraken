"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  DUPLICATE_SIGN_UP_MESSAGE,
  isDuplicateSignUpResponse,
} from "@/lib/auth/sign-up-response";
import { messageForSignUpAuthError } from "@/lib/auth/supabase-auth-error-message";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    const terms = fd.get("terms") === "on";

    const next: Record<string, string> = {};
    if (!name) next.name = "Informe seu nome.";
    if (!email) next.email = "Informe seu e-mail.";
    else if (!EMAIL_RE.test(email)) next.email = "E-mail inválido.";
    if (!password) next.password = "Crie uma senha.";
    else if (password.length < 8)
      next.password = "Senha deve ter pelo menos 8 caracteres.";
    if (!confirm) next.confirm = "Confirme sua senha.";
    else if (confirm !== password) next.confirm = "As senhas não coincidem.";
    if (!terms) next.terms = "Aceite os termos para continuar.";

    setErrors(next);
    setNotice(null);

    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, name } },
    });

    if (error) {
      setSubmitting(false);
      setNotice({ text: messageForSignUpAuthError(error), tone: "error" });
      return;
    }

    if (isDuplicateSignUpResponse(data.user)) {
      setSubmitting(false);
      setNotice({ text: DUPLICATE_SIGN_UP_MESSAGE, tone: "error" });
      return;
    }

    if (data.session) {
      await supabase.auth.signOut();
    }

    setSubmitting(false);
    router.push("/login?registered=1");
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
        id="register-name"
        name="name"
        type="text"
        autoComplete="name"
        label="Nome completo"
        placeholder="Seu nome"
        error={errors.name}
      />

      <Input
        id="register-email"
        name="email"
        type="email"
        autoComplete="email"
        label="E-mail"
        placeholder="voce@empresa.com"
        error={errors.email}
      />

      <Input
        id="register-password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        label="Senha"
        placeholder="Mínimo 8 caracteres"
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

      <Input
        id="register-confirm"
        name="confirm"
        type={showConfirm ? "text" : "password"}
        autoComplete="new-password"
        label="Confirmar senha"
        placeholder="Repita a senha"
        error={errors.confirm}
        suffix={
          <button
            type="button"
            className={eyeButtonClass}
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
          >
            {showConfirm ? (
              <EyeOff className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <Eye className="h-[18px] w-[18px]" aria-hidden />
            )}
          </button>
        }
      />

      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-snug text-neutral-gray">
          <input
            type="checkbox"
            name="terms"
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-border text-brand-purple focus:ring-2 focus:ring-brand-purple/25",
              errors.terms && "border-red-500"
            )}
            aria-invalid={errors.terms ? "true" : undefined}
            aria-describedby={errors.terms ? "terms-error" : undefined}
          />
          <span>
            Li e aceito os{" "}
            <Link
              href="#"
              className="font-semibold text-brand-purple underline-offset-2 hover:underline"
              onClick={(ev) => ev.preventDefault()}
            >
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link
              href="#"
              className="font-semibold text-brand-purple underline-offset-2 hover:underline"
              onClick={(ev) => ev.preventDefault()}
            >
              política de privacidade
            </Link>
            .
          </span>
        </label>
        {errors.terms ? (
          <p id="terms-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.terms}
          </p>
        ) : null}
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? "Criando…" : "Criar conta"}
      </Button>
    </form>
  );
}
