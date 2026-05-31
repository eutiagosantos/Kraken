import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-bold text-neutral-black">Página não encontrada</h1>
      <p className="text-sm text-neutral-gray">O endereço informado não existe.</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-btn bg-brand-purple px-5 py-3 text-sm font-semibold text-neutral-white transition-colors hover:bg-brand-purple-deep"
      >
        Voltar para a home
      </Link>
    </div>
  );
}
