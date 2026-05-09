import type { Metadata } from "next";
import { UploadWizard } from "@/components/app/home/UploadWizard";

export const metadata: Metadata = {
  title: "Novo Upload | DirectAds",
  description:
    "Selecione contas Meta, envie criativos, configure campanhas e publique em poucos passos.",
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
            Escolha as contas do Meta Ads, faça upload dos criativos, defina nome, objetivo, orçamento e
            estrutura — depois revise e publique.
          </p>
        </header>
        <UploadWizard />
      </div>
    </div>
  );
}
