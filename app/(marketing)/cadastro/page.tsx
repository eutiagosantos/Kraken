import type { Metadata } from "next";
import Link from "next/link";
import { KrakenMarkTile } from "@/components/branding/KrakenMarkTile";
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
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 items-center px-4 pb-2 pt-0 sm:px-6 sm:pb-4 sm:pt-1 lg:px-8">
      <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-12">
        <aside className="hidden flex-col justify-center lg:flex">
          <div className="mb-4">
            <KrakenMarkTile size="md" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-silver">
            Cadastro
          </p>
          <h1 className="mt-3 font-display text-[40px] font-bold leading-[1.1] tracking-tight text-neutral-black">
            Crie sua conta Kraken
          </h1>
          <div className="editorial-rule mt-6 max-w-xs" />
          <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-gray">
            Em menos de um minuto você começa a operar com segurança.
          </p>
          <ul className="mt-8 space-y-4">
            {trustPoints.map((point, index) => (
              <li key={point} className="flex items-start gap-4">
                <span
                  className="font-display text-2xl font-bold tabular-nums leading-none text-brand-purple/20"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="pt-1 text-sm font-medium text-neutral-black">
                  {point}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-neutral-gray">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-purple-dark underline-offset-2 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </aside>

        <div className="flex w-full flex-col items-center lg:items-stretch">
          <div className="w-full max-w-[440px] rounded-card border border-neutral-border bg-white px-6 pb-8 pt-5 shadow-subtle sm:px-10 sm:pb-10 sm:pt-6">
            <div className="mb-2 flex items-start gap-2 lg:hidden">
              <KrakenMarkTile size="landing" className="shrink-0" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-silver">
                  Cadastro
                </p>
                <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-neutral-black">
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

          <p className="mt-6 text-center text-sm text-neutral-gray lg:hidden">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-purple-dark underline-offset-2 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
