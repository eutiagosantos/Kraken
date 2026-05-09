import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function CadastroLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-bold text-brand-purple transition-colors hover:text-brand-purple-deep"
        >
          <Image src="/logo.svg" alt="" width={32} height={32} priority />
          DirectAds
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold text-neutral-gray transition-colors hover:text-brand-purple"
        >
          Voltar ao site
        </Link>
      </div>
      {children}
    </>
  );
}
