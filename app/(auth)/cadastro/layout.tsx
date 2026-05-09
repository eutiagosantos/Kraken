import Link from "next/link";
import type { ReactNode } from "react";
import { KrakenLoginHeader } from "@/components/auth/KrakenLoginHeader";

export default function CadastroLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#F9F9FB]">
      <KrakenLoginHeader ctaLabel="Entrar" ctaHref="/login" compact />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <footer className="mx-auto hidden w-full max-w-6xl px-4 pb-3 pt-1 text-center sm:block sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-neutral-gray">
          <Link href="#" className="transition-colors hover:text-neutral-black">
            Aviso de privacidade
          </Link>
          <Link href="#" className="transition-colors hover:text-neutral-black">
            Termos de Serviço
          </Link>
        </div>
      </footer>
    </div>
  );
}
