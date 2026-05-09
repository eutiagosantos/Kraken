"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
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

    setNotice(
      "Formulário válido. A integração com o backend ainda não está configurada — em breve você poderá criar sua conta por aqui."
    );
  }

  function handleMetaSignup() {
    setErrors({});
    setNotice(
      "Cadastro com Meta ainda não está configurado — em breve você poderá usar esta opção."
    );
  }

  const inputClass =
    "border-[#d4d4e8] bg-white focus:border-[#6B46E5] focus:ring-[#6B46E5]/25";

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {notice ? (
        <p
          className="rounded-lg border border-[rgba(20,158,97,0.24)] bg-[rgba(20,158,97,0.10)] px-3 py-2.5 text-sm text-[#026b3f]"
          role="status"
        >
          {notice}
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
            className="rounded-md p-2 text-neutral-gray transition-colors hover:bg-black/[0.06] hover:text-neutral-black"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden />
            ) : (
              <Eye className="h-5 w-5" aria-hidden />
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
            className="rounded-md p-2 text-neutral-gray transition-colors hover:bg-black/[0.06] hover:text-neutral-black"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
          >
            {showConfirm ? (
              <EyeOff className="h-5 w-5" aria-hidden />
            ) : (
              <Eye className="h-5 w-5" aria-hidden />
            )}
          </button>
        }
      />

      <div className="pt-1">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-neutral-gray">
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
          <p id="terms-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {errors.terms}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        className="w-full rounded-[10px] bg-[#6B46E5] py-3 text-base font-semibold text-white shadow-none transition-colors hover:bg-[#5b21e6]"
      >
        Criar conta
      </button>

      <div className="relative py-2">
        <div className="section-divider absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-70" />
        <span className="relative mx-auto block w-fit bg-white px-3 text-center text-sm text-neutral-gray">
          Ou
        </span>
      </div>

      <button
        type="button"
        onClick={handleMetaSignup}
        className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-neutral-border bg-white py-3 text-base font-semibold text-neutral-black shadow-subtle transition-colors hover:bg-neutral-white"
      >
        <Image src="/meta-symbol.svg" alt="" width={24} height={24} className="shrink-0" />
        Continuar com Meta
      </button>

      <p className="pt-3 text-center text-sm leading-relaxed text-neutral-gray">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#6B46E5] underline-offset-2 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
