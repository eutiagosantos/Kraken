import type { Metadata } from "next";
import { FilaProcessamentoClient } from "@/components/app/fila/FilaProcessamentoClient";

export const metadata: Metadata = {
  title: "Fila de processamento | Kraken",
  description: "Acompanha o envio e publicação dos teus uploads no Meta Ads.",
};

export default function FilaDeProcessamentoPage() {
  return (
    <div className="mx-auto max-w-[1680px]">
      <div className="flex flex-col gap-6">
        <header className="max-w-7xl">
          <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-neutral-black">
            Fila de processamento
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-dashboard-muted">
            Quando publicares a partir do Novo upload, o progresso do Meta Ads é mostrado aqui.
          </p>
        </header>
        <FilaProcessamentoClient />
      </div>
    </div>
  );
}
