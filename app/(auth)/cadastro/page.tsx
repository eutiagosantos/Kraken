import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Cadastro | Kraken",
  description: "Crie sua conta Kraken em poucos passos.",
};

const trustPoints = [
  "Setup em 60 segundos",
  "Sem custo de implantação",
  "Suporte por equipe humana",
];

export default function CadastroPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 items-center px-4 py-2 sm:px-6 sm:py-4 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-12">
        <aside className="hidden flex-col justify-center lg:flex">
          <div className="relative mb-6 flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#a855f7] via-[#8b5cf6] to-[#ec4899] shadow-lg shadow-purple-500/25">
            <div className="absolute inset-[3px] rounded-[13px] bg-gradient-to-br from-white/25 to-transparent" />
            <Image
              src="/kraken-mark.svg"
              alt=""
              width={36}
              height={36}
              className="relative drop-shadow-md brightness-0 invert"
            />
          </div>
          <h1 className="font-display text-[40px] font-bold leading-[1.1] tracking-tight text-neutral-black">
            Crie sua conta Kraken
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-neutral-gray">
            Em menos de um minuto você começa a operar com segurança.
          </p>
          <ul className="mt-6 space-y-2.5">
            {trustPoints.map((point) => (
              <li
                key={point}
                className="flex items-center gap-2.5 text-sm font-medium text-neutral-black"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-[#6B46E5]"
                  aria-hidden
                />
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-neutral-gray">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#6B46E5] underline-offset-2 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </aside>

        <div className="flex w-full flex-col items-center lg:items-stretch">
          <div className="w-full max-w-[440px] rounded-xl border border-neutral-border/80 bg-white px-5 py-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:px-8 sm:py-7">
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#a855f7] via-[#8b5cf6] to-[#ec4899] shadow-md shadow-purple-500/25">
                <div className="absolute inset-[2px] rounded-[10px] bg-gradient-to-br from-white/25 to-transparent" />
                <Image
                  src="/kraken-mark.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="relative drop-shadow-md brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight text-neutral-black">
                  Crie sua conta Kraken
                </h1>
                <p className="text-xs leading-snug text-neutral-gray">
                  Setup em 60 segundos.
                </p>
              </div>
            </div>

            <h2 className="hidden font-display text-xl font-bold tracking-tight text-neutral-black lg:block">
              Comece agora
            </h2>
            <p className="hidden text-sm leading-relaxed text-neutral-gray lg:mb-1 lg:block">
              Preencha os dados abaixo para criar sua conta.
            </p>

            <div className="mt-3 lg:mt-4">
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
