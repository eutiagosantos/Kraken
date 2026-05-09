"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingNotice, setPendingNotice] = useState(false);

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
    setPendingNotice(false);

    if (Object.keys(next).length > 0) return;

    setPendingNotice(true);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {pendingNotice ? (
        <p
          className="rounded-lg border border-neutral-border bg-brand-purple-subtle px-3 py-2.5 text-sm text-brand-purple-deep"
          role="status"
        >
          Formulário válido. A integração com o backend ainda não está
          configurada — em breve você poderá criar sua conta por aqui.
        </p>
      ) : null}

      <Input
        id="register-name"
        name="name"
        type="text"
        autoComplete="name"
        label="Nome completo"
        placeholder="Maria Silva"
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
        type="password"
        autoComplete="new-password"
        label="Senha"
        placeholder="Mínimo 8 caracteres"
        error={errors.password}
      />

      <Input
        id="register-confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        label="Confirmar senha"
        placeholder="Repita a senha"
        error={errors.confirm}
      />

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-neutral-gray">
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
            Aceito os{" "}
            <Link
              href="#"
              className="font-semibold text-brand-purple hover:text-brand-purple-deep"
              onClick={(ev) => ev.preventDefault()}
            >
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link
              href="#"
              className="font-semibold text-brand-purple hover:text-brand-purple-deep"
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

      <Button type="submit" className="w-full py-3 text-base">
        Criar conta
      </Button>

      <p className="text-center text-sm text-neutral-gray">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-purple hover:text-brand-purple-deep"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
