import Link from "next/link";

export default function ContasPage() {
  return (
    <div className="mx-auto max-w-lg rounded-card border border-dashboard-border bg-dashboard-surface p-10 text-center shadow-subtle">
      <h1 className="font-display text-2xl font-bold text-neutral-black">Contas Meta</h1>
      <p className="mt-2 text-sm text-neutral-gray">Gestão de contas em breve.</p>
      <Link
        href="/home"
        className="mt-6 inline-flex items-center justify-center rounded-btn bg-brand-purple px-5 py-3 text-sm font-semibold text-neutral-white transition-colors hover:bg-brand-purple-deep"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
