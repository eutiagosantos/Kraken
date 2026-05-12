"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MetaAppDevModePublishHelp } from "@/components/app/fila/MetaAppDevModePublishHelp";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import { mockWizardDataAdapter } from "@/lib/wizard/data-adapter";
import { buildWizardPublishPayload } from "@/lib/wizard/build-wizard-publish-payload";
import { getWizardPublishSliceFromStore } from "@/lib/wizard/get-wizard-publish-slice";
import { useWizardStore } from "@/lib/stores/wizardStore";

export function FilaProcessamentoClient() {
  const queuePublish = useWizardStore((s) => s.queuePublish);
  const patchQueuePublish = useWizardStore((s) => s.patchQueuePublish);

  useEffect(() => {
    const started = useWizardStore.getState().consumePublishJobTrigger() === "wizard";
    if (!started) return;

    useWizardStore.getState().patchQueuePublish({ active: true, progress: 4, error: null, success: false });

    const timer = setInterval(() => {
      const s = useWizardStore.getState();
      const p = s.queuePublish.progress;
      if (p < 90) {
        s.patchQueuePublish({ progress: p + 5 + Math.random() * 6 });
      }
    }, 220);

    void (async () => {
      try {
        const { snapshot, creativeFiles } = buildWizardPublishPayload(getWizardPublishSliceFromStore());
        await mockWizardDataAdapter.publishCampaigns({ snapshot, creativeFiles });
        clearInterval(timer);
        useWizardStore.getState().patchQueuePublish({ progress: 100, success: true, active: false });
        setTimeout(() => {
          useWizardStore.getState().reset();
        }, 750);
      } catch (e) {
        clearInterval(timer);
        useWizardStore.getState().patchQueuePublish({
          active: false,
          error: e instanceof Error ? e.message : "Falha na publicação.",
          progress: 0,
          success: false,
        });
      }
    })();

    return () => {
      clearInterval(timer);
    };
  }, []);

  const idle =
    !queuePublish.active && !queuePublish.success && !queuePublish.error && queuePublish.progress === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {idle ? (
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-neutral-black">Ainda não há envios na fila</p>
          <p className="mt-2 text-sm text-dashboard-muted">
            Quando publicares um upload a partir do assistente, o progresso aparece aqui.
          </p>
          <Link
            href="/upload"
            className="mt-6 inline-flex rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
          >
            Ir para Novo upload
          </Link>
        </div>
      ) : null}

      {!idle ? (
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-black">
            {queuePublish.error
              ? "Erro na publicação"
              : queuePublish.success
                ? "Publicação concluída"
                : "Publicando campanhas"}
          </h2>
          {queuePublish.error ? (
            <div className="mt-2">
              <p className="text-sm whitespace-pre-wrap text-red-600">{queuePublish.error}</p>
              <MetaAppDevModePublishHelp errorMessage={queuePublish.error} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-dashboard-muted">
              {queuePublish.success
                ? "Concluído!"
                : queuePublish.active || queuePublish.progress > 0
                  ? "Processando no Meta Ads..."
                  : "—"}
            </p>
          )}
          <div className="mt-4">
            <ProgressBar value={queuePublish.error ? 0 : queuePublish.progress} />
            {!queuePublish.error ? (
              <p className="mt-2 text-right text-xs font-semibold text-brand-purple">
                {Math.round(queuePublish.progress)}%
              </p>
            ) : null}
          </div>
          {queuePublish.error ? (
            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-dashboard-border bg-dashboard-base py-2 text-sm font-semibold text-neutral-black hover:bg-neutral-white"
              onClick={() => patchQueuePublish({ error: null, progress: 0, success: false, active: false })}
            >
              Fechar
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
