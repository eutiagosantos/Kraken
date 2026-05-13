"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MetaAppDevModePublishHelp } from "@/components/app/fila/MetaAppDevModePublishHelp";
import { UploadJobsList, type UploadJobListRow } from "@/components/app/fila/UploadJobsList";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import { mockWizardDataAdapter } from "@/lib/wizard/data-adapter";
import { buildWizardPublishPayload } from "@/lib/wizard/build-wizard-publish-payload";
import { getWizardPublishSliceFromStore } from "@/lib/wizard/get-wizard-publish-slice";
import { partitionUploadJobsByActive, uploadJobShouldPollForUpdates } from "@/lib/wizard/upload-jobs-in-flight";
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
  const [smoothProgress, setSmoothProgress] = useState(0);
  const loadJobsInFlight = useRef(false);

  const loadJobs = useCallback(async () => {
    if (loadJobsInFlight.current) return;
    loadJobsInFlight.current = true;
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
      loadJobsInFlight.current = false;
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const needsPolling =
    jobs.some((j) => uploadJobShouldPollForUpdates(j)) || queuePublish.active;

  useEffect(() => {
    if (!needsPolling) return;
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadJobs();
    }, 5000);
    return () => clearInterval(t);
  }, [needsPolling, loadJobs]);

  useEffect(() => {
    if (!needsPolling) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadJobs();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
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

  const isProcessing =
    (queuePublish.active && !queuePublish.success && !queuePublish.error) ||
    (jobs.some((j) => j.status === "processing" || j.status === "awaiting_creatives") && !queuePublish.error);

  useEffect(() => {
    if (!isProcessing) {
      setSmoothProgress(0);
      return;
    }
    const t = setInterval(() => {
      setSmoothProgress((prev) => (prev >= 90 ? 90 : prev + 0.4));
    }, 1000);
    return () => clearInterval(t);
  }, [isProcessing]);

  const { activeJobs, historyJobs } = useMemo(() => partitionUploadJobsByActive(jobs), [jobs]);

  const queueIdle =
    !queuePublish.active && !queuePublish.success && !queuePublish.error && queuePublish.progress === 0;

  const liveJob =
    queuePublish.active && !queuePublish.success && !queuePublish.error ? inFlightJob(jobs) : undefined;

  const serverOnlyActive = queueIdle && activeJobs.length > 0;
  const showRecentSection = !queueIdle || activeJobs.length > 0;

  const embeddedRecentJob =
    queuePublish.active && !queuePublish.success && !queuePublish.error
      ? liveJob ?? activeJobs[0]
      : serverOnlyActive
        ? activeJobs[0]
        : undefined;

  const rawPublishProgress = queuePublish.error
    ? 0
    : queuePublish.success
      ? 100
      : liveJob
        ? progressFromJob(liveJob)
        : serverOnlyActive
          ? progressFromJob(activeJobs[0])
          : queuePublish.progress;
  const publishCardProgress = queuePublish.error || queuePublish.success
    ? rawPublishProgress
    : Math.max(rawPublishProgress, Math.round(smoothProgress));

  const recentTitle = queuePublish.error
    ? "Erro na publicação"
    : queuePublish.success
      ? "Publicação concluída"
      : serverOnlyActive && queueIdle
        ? "Envio em curso"
        : "Publicando campanhas";

  const recentDescription = queuePublish.error ? null : queuePublish.success ? (
    <p className="mt-2 text-sm text-dashboard-muted">
      Concluído — o registo passa para o histórico abaixo.
    </p>
  ) : serverOnlyActive && queueIdle ? (
    <p className="mt-2 text-sm text-dashboard-muted">Há um envio em curso na tua conta (por exemplo, outro separador ou sessão).</p>
  ) : (
    <p className="mt-2 text-sm text-dashboard-muted">
      {liveJob?.status === "awaiting_creatives"
        ? "A enviar criativos e a preparar a publicação no Meta…"
        : "A processar no Meta Ads…"}
    </p>
  );

  const showEmptyAll = jobs.length === 0 && queueIdle && !jobsLoading;
  const showHistoryBlock = !jobsLoading && !jobsError && (!showEmptyAll || showRecentSection);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10">
      {showRecentSection ? (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-neutral-black">Envio recente</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-dashboard-muted">
              Estado do envio actual ou em curso na plataforma.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface shadow-sm ring-1 ring-black/[0.04]">
            {queuePublish.error ? (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-black">{recentTitle}</h3>
                <div className="mt-2">
                  <p className="text-sm whitespace-pre-wrap text-red-600">{queuePublish.error}</p>
                  <MetaAppDevModePublishHelp errorMessage={queuePublish.error} />
                </div>
                <button
                  type="button"
                  className="mt-5 w-full rounded-xl border border-dashboard-border bg-dashboard-base py-2.5 text-sm font-semibold text-neutral-black transition-colors hover:bg-neutral-white"
                  onClick={() => {
                    patchQueuePublish({ error: null, progress: 0, success: false, active: false });
                    void loadJobs();
                  }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="border-b border-dashboard-border/70 px-6 pb-4 pt-6">
                  <h3 className="text-lg font-semibold tracking-tight text-neutral-black">{recentTitle}</h3>
                  {recentDescription}
                </div>
                <div className="px-6 py-5">
                  <ProgressBar value={publishCardProgress} />
                  <p className="mt-2 text-right text-xs font-semibold tabular-nums text-brand-purple">
                    {Math.round(publishCardProgress)}%
                  </p>
                </div>
                {embeddedRecentJob ? (
                  <div className="border-t border-dashboard-border/60 bg-dashboard-base/25 px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
                    <UploadJobsList variant="recent" jobs={[embeddedRecentJob]} />
                  </div>
                ) : queuePublish.active && !queuePublish.success && !queuePublish.error ? (
                  <div className="border-t border-dashboard-border/60 px-6 py-4">
                    <p className="text-sm text-dashboard-muted">A preparar o registo do envio…</p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-neutral-black">Histórico</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-dashboard-muted">
              Envios já terminados (concluídos ou com erro), sem o envio em curso.
            </p>
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
        ) : showEmptyAll ? (
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
        ) : showHistoryBlock ? (
          <>
            {historyJobs.length > 0 ? (
              <UploadJobsList jobs={historyJobs} />
            ) : (
              <p className="text-sm text-dashboard-muted">
                Ainda não há entradas no histórico — o envio activo aparece em «Envio recente».
              </p>
            )}
          </>
        ) : null}
      </section>
    </div>
  );
}
