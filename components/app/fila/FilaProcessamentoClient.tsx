"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MetaAppDevModePublishHelp } from "@/components/app/fila/MetaAppDevModePublishHelp";
import { UploadJobsList, type UploadJobListRow } from "@/components/app/fila/UploadJobsList";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import { mockWizardDataAdapter } from "@/lib/wizard/data-adapter";
import { buildWizardPublishPayload } from "@/lib/wizard/build-wizard-publish-payload";
import { getWizardPublishSliceFromStore } from "@/lib/wizard/get-wizard-publish-slice";
import { useWizardStore } from "@/lib/stores/wizardStore";

type UploadJobsApiResponse = {
  data?: { jobs: UploadJobListRow[] };
  error?: string;
};

function inFlightJob(jobs: UploadJobListRow[]) {
  return jobs.find((j) => j.status === "awaiting_creatives" || j.status === "processing");
}

function progressFromJob(j: UploadJobListRow | undefined): number {
  if (!j) return 6;
  if (j.status === "awaiting_creatives") return 8;
  if (j.total > 0) {
    const raw = (j.done / j.total) * 100;
    return j.status === "processing" && j.done >= j.total ? 99 : Math.min(99, Math.round(raw));
  }
  return 10;
}

export function FilaProcessamentoClient() {
  const queuePublish = useWizardStore((s) => s.queuePublish);
  const patchQueuePublish = useWizardStore((s) => s.patchQueuePublish);

  const [jobs, setJobs] = useState<UploadJobListRow[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/upload-jobs?limit=50", { credentials: "include" });
      const body = (await res.json()) as UploadJobsApiResponse;
      if (!res.ok) {
        setJobsError(body.error ?? "Não foi possível carregar os uploads.");
        return;
      }
      setJobsError(null);
      setJobs(body.data?.jobs ?? []);
    } catch {
      setJobsError("Não foi possível carregar os uploads.");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const needsPolling =
    jobs.some((j) => j.status === "processing" || j.status === "awaiting_creatives") || queuePublish.active;

  useEffect(() => {
    if (!needsPolling) return;
    const t = setInterval(() => void loadJobs(), 2500);
    return () => clearInterval(t);
  }, [needsPolling, loadJobs]);

  useEffect(() => {
    if (!queuePublish.active || queuePublish.success || queuePublish.error) return;
    const j = inFlightJob(jobs);
    const next = progressFromJob(j);
    if (Math.abs(next - queuePublish.progress) >= 1) {
      patchQueuePublish({ progress: next });
    }
  }, [jobs, queuePublish.active, queuePublish.success, queuePublish.error, queuePublish.progress, patchQueuePublish]);

  useEffect(() => {
    const started = useWizardStore.getState().consumePublishJobTrigger() === "wizard";
    if (!started) return;

    useWizardStore.getState().patchQueuePublish({ active: true, progress: 6, error: null, success: false });

    void (async () => {
      try {
        const { snapshot, creativeFiles } = buildWizardPublishPayload(getWizardPublishSliceFromStore());
        await mockWizardDataAdapter.publishCampaigns({ snapshot, creativeFiles });
        useWizardStore.getState().patchQueuePublish({ progress: 100, success: true, active: false });
        await loadJobs();
        setTimeout(() => {
          useWizardStore.getState().reset();
        }, 750);
      } catch (e) {
        useWizardStore.getState().patchQueuePublish({
          active: false,
          error: e instanceof Error ? e.message : "Falha na publicação.",
          progress: 0,
          success: false,
        });
        void loadJobs();
      }
    })();
  }, [loadJobs]);

  const queueIdle =
    !queuePublish.active && !queuePublish.success && !queuePublish.error && queuePublish.progress === 0;
  const liveJob = queuePublish.active && !queuePublish.success && !queuePublish.error ? inFlightJob(jobs) : undefined;
  const publishCardProgress = queuePublish.error
    ? 0
    : queuePublish.success
      ? 100
      : liveJob
        ? progressFromJob(liveJob)
        : queuePublish.progress;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {!queueIdle ? (
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
                ? "Concluído — o envio aparece na lista abaixo."
                : liveJob?.status === "awaiting_creatives"
                  ? "A enviar criativos e a preparar a publicação no Meta…"
                  : "A processar no Meta Ads…"}
            </p>
          )}
          <div className="mt-4">
            <ProgressBar value={publishCardProgress} />
            {!queuePublish.error ? (
              <p className="mt-2 text-right text-xs font-semibold text-brand-purple">
                {Math.round(publishCardProgress)}%
              </p>
            ) : null}
          </div>
          {queuePublish.error ? (
            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-dashboard-border bg-dashboard-base py-2 text-sm font-semibold text-neutral-black hover:bg-neutral-white"
              onClick={() => {
                patchQueuePublish({ error: null, progress: 0, success: false, active: false });
                void loadJobs();
              }}
            >
              Fechar
            </button>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-neutral-black">Os teus uploads</h2>
            <p className="mt-1 text-sm text-dashboard-muted">Histórico de envios e publicações no Meta.</p>
          </div>
          <Link
            href="/campanhas"
            className="text-sm font-semibold text-brand-purple hover:text-brand-purple-dark"
          >
            Ver campanhas
          </Link>
        </div>

        {jobsLoading ? (
          <p className="text-sm text-dashboard-muted">A carregar…</p>
        ) : jobsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
            {jobsError}
            <button
              type="button"
              className="mt-2 block font-semibold text-brand-purple hover:underline"
              onClick={() => {
                setJobsLoading(true);
                void loadJobs();
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : jobs.length === 0 && queueIdle ? (
          <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-neutral-black">Ainda não há envios registados</p>
            <p className="mt-2 text-sm text-dashboard-muted">
              Quando publicares um upload a partir do assistente, o envio aparece aqui com todos os detalhes.
            </p>
            <Link
              href="/upload"
              className="mt-6 inline-flex rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
            >
              Ir para Novo upload
            </Link>
          </div>
        ) : (
          <>
            <UploadJobsList jobs={jobs} />
            {jobs.length === 0 && !queueIdle ? (
              <p className="text-sm text-dashboard-muted">A preparar o registo do envio na lista…</p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
