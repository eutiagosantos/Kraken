"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function KrakenLoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const identifier = String(fd.get("identifier") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    const next: Record<string, string> = {};
    if (!identifier) next.identifier = "Informe seu e-mail ou nome de usuário.";
    if (!password) next.password = "Informe sua senha.";

    setErrors(next);
    setNotice(null);

    if (Object.keys(next).length > 0) return;

    setNotice(
      "Formulário válido. A integração com o backend ainda não está configurada — em breve você poderá entrar na conta por aqui."
    );
  }

  function handleMetaLogin() {
    setErrors({});
    setNotice(
      "Login com Meta ainda não está configurado — em breve você poderá usar esta opção."
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {notice ? (
        <p
          className="rounded-lg border border-neutral-border bg-brand-purple-subtle px-3 py-2.5 text-sm text-brand-purple-deep"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      <Input
        id="login-identifier"
        name="identifier"
        type="text"
        autoComplete="username"
        label="Email ou nome de usuário"
        labelSrOnly
        placeholder="Email ou nome de usuário"
        error={errors.identifier}
        className="border-[#d4d4e8] focus:border-[#6B46E5] focus:ring-[#6B46E5]/25"
      />

      <Input
        id="login-password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        label="Senha"
        labelSrOnly
        placeholder="Senha"
        error={errors.password}
        className="border-neutral-border bg-[#F5F5F7]"
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

      <div className="pt-0.5">
        <Link
          href="#"
          className="text-sm font-semibold text-[#6B46E5] underline-offset-2 hover:underline"
        >
          Esqueceu sua senha ou nome de usuário?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full rounded-[10px] bg-[#6B46E5] py-3 text-base font-semibold text-white shadow-none hover:bg-[#5b21e6]"
      >
        Continuar
      </Button>

      <div className="relative py-2">
        <div className="section-divider absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-70" />
        <span className="relative mx-auto block w-fit bg-white px-3 text-center text-sm text-neutral-gray">
          Ou
        </span>
      </div>

      <button
        type="button"
        onClick={handleMetaLogin}
        className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-neutral-border bg-white py-3 text-base font-semibold text-neutral-black shadow-subtle transition-colors hover:bg-neutral-white"
      >
        <Image src="/meta-symbol.svg" alt="" width={24} height={24} className="shrink-0" />
        Continuar com Meta
      </button>

      <p className="pt-4 text-center text-sm leading-relaxed text-neutral-gray">
        Ainda não consegue fazer login? Envie-nos um{" "}
        <a
          href="mailto:support@kraken.com"
          className="font-semibold text-[#6B46E5] underline-offset-2 hover:underline"
        >
          e-mail
        </a>
      </p>
    </form>
  );
}
