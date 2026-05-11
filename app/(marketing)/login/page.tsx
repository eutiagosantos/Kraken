import type { Metadata } from "next";
import { KrakenMarkTile } from "@/components/branding/KrakenMarkTile";
import { KrakenLoginForm } from "@/components/auth/KrakenLoginForm";

export const metadata: Metadata = {
  title: "Login | Kraken",
  description: "Faça login na sua conta Kraken.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[420px] rounded-xl border border-neutral-border/80 bg-white px-6 py-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:px-10 sm:py-10">
        <div className="mb-8 flex justify-center">
          <KrakenMarkTile size="lg" />
        </div>

        <h1 className="mb-2 text-center font-display text-2xl font-bold tracking-tight text-neutral-black sm:text-[28px]">
          Entrar na Kraken
        </h1>
        <p className="mb-8 text-center text-sm leading-relaxed text-neutral-gray">
          Autenticação da app e permissões para sincronizar contas de anúncio Meta no mesmo fluxo com Meta.
        </p>

        <KrakenLoginForm />
      </div>
    </div>
  );
}
