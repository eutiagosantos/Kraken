"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-bold text-neutral-black">Algo deu errado</h1>
      <p className="max-w-md text-sm text-neutral-gray">
        Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-btn bg-brand-purple px-5 py-3 text-sm font-semibold text-neutral-white transition-colors hover:bg-brand-purple-deep"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-btn border border-neutral-border px-5 py-3 text-sm font-semibold text-neutral-black transition-colors hover:bg-neutral-white"
        >
          Ir para home
        </Link>
      </div>
    </div>
  );
}
