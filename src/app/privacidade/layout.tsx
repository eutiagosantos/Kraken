import Link from "next/link";
import type { ReactNode } from "react";
import { KrakenLoginHeader } from "@/components/auth/KrakenLoginHeader";

export default function PrivacidadeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F9F9FB]">
      <KrakenLoginHeader ctaLabel="Entrar" ctaHref="/login" compact />
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 text-center sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-gray">
          <Link href="/" className="transition-colors hover:text-neutral-black">
            Início
          </Link>
          <Link href="/login" className="transition-colors hover:text-neutral-black">
            Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
