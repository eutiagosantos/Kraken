"use client";

export default function CampanhasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="rounded-card border border-semantic-red/20 bg-semantic-red-bg p-4">
      <p className="text-sm text-neutral-black">Falha ao carregar campanhas.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 inline-flex rounded-btn bg-brand-purple px-4 py-2 text-xs font-semibold text-neutral-white"
      >
        Tentar novamente
      </button>
    </div>
  );
}
