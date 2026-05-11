import type { Metadata } from "next";
import dynamic from "next/dynamic";

const UploadWizard = dynamic(
  () => import("@/components/app/home/UploadWizard").then((mod) => mod.UploadWizard),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Novo Upload | Kraken",
  description:
    "Configure em 3 passos: criativos e contas, campanha e público, depois publique em massa.",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-[1680px]">
      <div className="flex flex-col gap-6">
        <header className="max-w-3xl">
          <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-neutral-black">
            Novo upload
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-dashboard-muted">
            Step 1: criativos e contas. Step 2: configuração da campanha. Step 3: público, revisão final e
            publicação em massa.
          </p>
        </header>
        <UploadWizard />
      </div>
    </div>
  );
}
