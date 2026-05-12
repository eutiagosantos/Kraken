"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/Input";
import { messageForSignUpAuthError } from "@/lib/auth/supabase-auth-error-message";
import { buildOAuthReturnRedirectTo } from "@/lib/auth/supabase-oauth-redirects";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const META_SCOPES = [
  "email",
  "public_profile",
  "ads_read",
  "ads_management",
  "business_management",
  "pages_show_list",
  "pages_manage_ads",
].join(",");

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
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, name },
        emailRedirectTo: origin ? `${origin}/login` : undefined,
      },
    });
    setSubmitting(false);

    if (error) {
      setNotice({ text: messageForSignUpAuthError(error), tone: "error" });
      return;
    }

    if (data.session) {
      router.push("/home");
      router.refresh();
      return;
    }

    setNotice({
      text: "Verifique o seu e-mail para confirmar a conta antes de entrar.",
      tone: "success",
    });
  }

  async function handleMetaSignup() {
    setErrors({});
    setNotice(null);
    const redirectTo = buildOAuthReturnRedirectTo(window.location.origin, "/home");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo,
        scopes: META_SCOPES,
      },
    });
    if (error) {
      setNotice({ text: error.message, tone: "error" });
    }
  }

  const inputClass =
    "border-[#d4d4e8] bg-white py-2 text-[15px] focus:border-[#6B46E5] focus:ring-[#6B46E5]/25";

  const eyeButtonClass =
    "rounded-md p-1.5 text-neutral-gray transition-colors hover:bg-black/[0.06] hover:text-neutral-black";

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {notice ? (
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-xs",
            notice.tone === "success" &&
              "border-[rgba(20,158,97,0.24)] bg-[rgba(20,158,97,0.10)] text-[#026b3f]",
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
        labelSrOnly
        placeholder="Nome completo"
        error={errors.name}
        className={inputClass}
      />

      <Input
        id="register-email"
        name="email"
        type="email"
        autoComplete="email"
        label="E-mail"
        labelSrOnly
        placeholder="Email"
        error={errors.email}
        className={inputClass}
      />

      <Input
        id="register-password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        label="Senha"
        labelSrOnly
        placeholder="Senha (mínimo 8 caracteres)"
        error={errors.password}
        className={inputClass}
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
        labelSrOnly
        placeholder="Confirmar senha"
        error={errors.confirm}
        className={inputClass}
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
              "mt-0.5 h-4 w-4 shrink-0 rounded border-[#d4d4e8] text-[#6B46E5] focus:ring-2 focus:ring-[#6B46E5]/25",
              errors.terms && "border-red-500"
            )}
            aria-invalid={errors.terms ? "true" : undefined}
            aria-describedby={errors.terms ? "terms-error" : undefined}
          />
          <span>
            Li e aceito os{" "}
            <Link
              href="#"
              className="font-semibold text-[#6B46E5] underline-offset-2 hover:underline"
              onClick={(ev) => ev.preventDefault()}
            >
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link
              href="#"
              className="font-semibold text-[#6B46E5] underline-offset-2 hover:underline"
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

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[10px] bg-[#6B46E5] py-2.5 text-[15px] font-semibold text-white shadow-none transition-colors hover:bg-[#5b21e6] disabled:opacity-60"
      >
        {submitting ? "A criar…" : "Criar conta"}
      </button>

      <div className="relative py-1">
        <div className="section-divider absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-70" />
        <span className="relative mx-auto block w-fit bg-white px-3 text-center text-xs text-neutral-gray">
          Ou
        </span>
      </div>

      <button
        type="button"
        onClick={() => void handleMetaSignup()}
        className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-neutral-border bg-white py-2.5 text-[15px] font-semibold text-neutral-black shadow-subtle transition-colors hover:bg-neutral-white"
      >
        <Image src="/meta-symbol.svg" alt="" width={20} height={20} className="shrink-0" />
        Continuar com Meta
      </button>
    </form>
  );
}
