"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MetaAppDevModePublishHelp } from "@/components/app/fila/MetaAppDevModePublishHelp";
import { UploadJobsList, type UploadJobListRow } from "@/components/app/fila/UploadJobsList";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import type { PublishProgressEvent } from "@/lib/wizard/data-adapter";
import { mockWizardDataAdapter } from "@/lib/wizard/data-adapter";
import { buildWizardPublishPayload } from "@/lib/wizard/build-wizard-publish-payload";
import { getWizardPublishSliceFromStore } from "@/lib/wizard/get-wizard-publish-slice";
import {
  partitionUploadJobsByActive,
  UPLOAD_JOB_POLL_MAX_AGE_MS,
  uploadJobShouldPollForUpdates,
} from "@/lib/wizard/upload-jobs-in-flight";
import { parseUploadJobErrorDetails } from "@/lib/api/upload-job-summary-schema";
import { useWizardStore, type WizardQueuePublish } from "@/lib/stores/wizardStore";
import {
  computeUnifiedPublishProgress,
  publishPhaseLabelPt,
  queuePublishFieldsFromProgressEvent,
  serverJobToPublishProgress,
  type QueuePublishProgressFields,
} from "@/lib/wizard/unified-publish-progress";

type UploadJobsApiResponse = {
  data?: { jobs: UploadJobListRow[] };
  error?: string;
};

const POLL_ACTIVE_MS = 2000;
const POLL_IDLE_MS = 5000;

function inFlightJob(jobs: UploadJobListRow[]) {
  return jobs.find((j) => j.status === "awaiting_creatives" || j.status === "processing");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function queueFieldsFromStore(q: WizardQueuePublish): QueuePublishProgressFields {
  return {
    phase: q.phase,
    progress: q.progress,
    uploadBytesUploaded: q.uploadBytesUploaded,
    uploadBytesTotal: q.uploadBytesTotal,
    uploadFileIndex: q.uploadFileIndex,
    uploadFileCount: q.uploadFileCount,
    publishDone: q.publishDone,
    publishTotal: q.publishTotal,
  };
}

function applyProgressEvent(
  patchQueuePublish: (partial: Partial<WizardQueuePublish>) => void,
  event: PublishProgressEvent
) {
  const prev = queueFieldsFromStore(useWizardStore.getState().queuePublish);
  const next = queuePublishFieldsFromProgressEvent(event, prev);
  patchQueuePublish(next);
}

async function waitForDeferredPublishJob(
  publishId: string,
  onJobUpdate: (job: UploadJobListRow) => void
): Promise<void> {
  const deadline = Date.now() + UPLOAD_JOB_POLL_MAX_AGE_MS;
  while (Date.now() < deadline) {
    const res = await fetch("/api/upload-jobs?limit=50", { credentials: "include" });
    const body = (await res.json()) as UploadJobsApiResponse;
    const job = (body.data?.jobs ?? []).find((j) => j.id === publishId);
    if (!job) {
      throw new Error("Operação de publicação não encontrada na fila.");
    }
    onJobUpdate(job);
    if (job.status === "completed") return;
    if (job.status === "error") {
      const details = parseUploadJobErrorDetails(job.error_details);
      throw new Error(details?.message ?? "Publicação falhou.");
    }
    await sleep(POLL_ACTIVE_MS);
  }
  throw new Error(
    "A publicação em segundo plano demorou demasiado. Verifica a fila de processamento e o Meta Ads Manager."
  );
}

export function FilaProcessamentoClient() {
  const queuePublish = useWizardStore((s) => s.queuePublish);
  const patchQueuePublish = useWizardStore((s) => s.patchQueuePublish);

  const [jobs, setJobs] = useState<UploadJobListRow[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const loadJobsInFlight = useRef(false);
  const mountedRef = useRef(true);

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

  const syncPublishProgressFromJob = useCallback(
    (job: UploadJobListRow) => {
      if (!queuePublish.active || queuePublish.success || queuePublish.error) return;
      const server = serverJobToPublishProgress(job);
      const prev = queueFieldsFromStore(useWizardStore.getState().queuePublish);
      const merged: QueuePublishProgressFields = {
        ...prev,
        phase: server.phase === "done" ? "publishing" : server.phase,
        publishDone: server.publishDone,
        publishTotal: server.publishTotal,
      };
      const progress = computeUnifiedPublishProgress({
        phase: merged.phase,
        uploadBytesUploaded: merged.uploadBytesUploaded,
        uploadBytesTotal: merged.uploadBytesTotal,
        publishDone: merged.publishDone,
        publishTotal: merged.publishTotal,
        uploadFileIndex: merged.uploadFileIndex > 0 ? merged.uploadFileIndex : undefined,
        uploadFileCount: merged.uploadFileCount > 0 ? merged.uploadFileCount : undefined,
      });
      if (Math.abs(progress - prev.progress) >= 1 || server.publishTotal !== prev.publishTotal) {
        patchQueuePublish({
          phase: merged.phase,
          publishDone: merged.publishDone,
          publishTotal: merged.publishTotal,
          progress,
        });
      }
    },
    [patchQueuePublish, queuePublish.active, queuePublish.error, queuePublish.success]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const needsPolling =
    jobs.some((j) => uploadJobShouldPollForUpdates(j)) || queuePublish.active;

  const pollIntervalMs =
    queuePublish.active || jobs.some((j) => uploadJobShouldPollForUpdates(j))
      ? POLL_ACTIVE_MS
      : POLL_IDLE_MS;

  useEffect(() => {
    if (!needsPolling) return;
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadJobs();
    }, pollIntervalMs);
    return () => clearInterval(t);
  }, [needsPolling, loadJobs, pollIntervalMs]);

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
    if (j?.status === "processing" && j.total > 0) {
      syncPublishProgressFromJob(j);
    }
  }, [jobs, queuePublish.active, queuePublish.success, queuePublish.error, syncPublishProgressFromJob]);

  useEffect(() => {
    const started = useWizardStore.getState().consumePublishJobTrigger() === "wizard";
    if (!started) return;

    patchQueuePublish({
      active: true,
      success: false,
      error: null,
      phase: "preparing",
      progress: 5,
      uploadBytesUploaded: 0,
      uploadBytesTotal: 0,
      uploadFileIndex: 0,
      uploadFileCount: 0,
      publishDone: 0,
      publishTotal: 0,
    });

    void (async () => {
      try {
        const { snapshot, creativeFiles } = buildWizardPublishPayload(getWizardPublishSliceFromStore());
        const result = await mockWizardDataAdapter.publishCampaigns({
          snapshot,
          creativeFiles,
          onProgress: (event) => applyProgressEvent(patchQueuePublish, event),
        });
        if (result.deferred) {
          await waitForDeferredPublishJob(result.publishId, (job) => {
            if (!mountedRef.current) return;
            setJobs((prev) => {
              const idx = prev.findIndex((j) => j.id === job.id);
              if (idx < 0) return [job, ...prev];
              const next = [...prev];
              next[idx] = job;
              return next;
            });
            syncPublishProgressFromJob(job);
          });
        }
        if (!mountedRef.current) return;
        patchQueuePublish({
          progress: 100,
          phase: "done",
          success: true,
          active: false,
        });
        await loadJobs();
        if (!mountedRef.current) return;
        setTimeout(() => {
          if (!mountedRef.current) return;
          useWizardStore.getState().reset();
        }, 750);
      } catch (e) {
        if (!mountedRef.current) return;
        patchQueuePublish({
          active: false,
          error: e instanceof Error ? e.message : "Falha na publicação.",
          progress: 0,
          phase: "error",
          success: false,
        });
        void loadJobs();
      }
    })();
  }, [loadJobs, patchQueuePublish, syncPublishProgressFromJob]);

  const { activeJobs, historyJobs } = useMemo(() => partitionUploadJobsByActive(jobs), [jobs]);

  const queueIdle =
    !queuePublish.active &&
    !queuePublish.success &&
    !queuePublish.error &&
    queuePublish.phase === "idle";

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

  const progressInput = useMemo(
    () => ({
      phase: queuePublish.phase,
      uploadBytesUploaded: queuePublish.uploadBytesUploaded,
      uploadBytesTotal: queuePublish.uploadBytesTotal,
      publishDone: queuePublish.publishDone,
      publishTotal: queuePublish.publishTotal,
      uploadFileIndex: queuePublish.uploadFileIndex > 0 ? queuePublish.uploadFileIndex : undefined,
      uploadFileCount: queuePublish.uploadFileCount > 0 ? queuePublish.uploadFileCount : undefined,
    }),
    [queuePublish]
  );

  const unifiedProgress = useMemo(() => {
    if (queuePublish.error) return 0;
    if (queuePublish.success) return 100;
    if (serverOnlyActive && embeddedRecentJob) {
      const server = serverJobToPublishProgress(embeddedRecentJob);
      return computeUnifiedPublishProgress({
        phase: "publishing",
        uploadBytesUploaded: queuePublish.uploadBytesTotal || 1,
        uploadBytesTotal: queuePublish.uploadBytesTotal || 1,
        publishDone: server.publishDone,
        publishTotal: server.publishTotal,
      });
    }
    return computeUnifiedPublishProgress(progressInput);
  }, [queuePublish, serverOnlyActive, embeddedRecentJob, progressInput]);

  const recentTitle = queuePublish.error
    ? "Erro na publicação"
    : queuePublish.success
      ? "Publicação concluída"
      : "Envio em curso";

  const recentDescription = queuePublish.error ? null : queuePublish.success ? (
    <p className="mt-2 text-sm text-dashboard-muted">
      Concluído — o registo passa para o histórico abaixo.
    </p>
  ) : serverOnlyActive && queueIdle ? (
    <p className="mt-2 text-sm text-dashboard-muted">
      Há um envio em curso na tua conta (por exemplo, outro separador ou sessão).
    </p>
  ) : (
    <p className="mt-2 text-sm text-dashboard-muted">{publishPhaseLabelPt(progressInput)}</p>
  );

  const progressDetail = useMemo(() => {
    if (queuePublish.success) return null;
    if (progressInput.phase === "uploading" && progressInput.uploadBytesTotal > 0) {
      const mb = (n: number) => (n / (1024 * 1024)).toFixed(1);
      return `${mb(progressInput.uploadBytesUploaded)} / ${mb(progressInput.uploadBytesTotal)} MB`;
    }
    if (progressInput.phase === "publishing" && progressInput.publishTotal > 0) {
      return `${progressInput.publishDone} de ${progressInput.publishTotal} unidades`;
    }
    return null;
  }, [progressInput, queuePublish.success]);

  const showEmptyAll = jobs.length === 0 && queueIdle && !jobsLoading;
  const showHistoryBlock = !jobsLoading && !jobsError && (!showEmptyAll || showRecentSection);
  const hideHistoryLoading = queuePublish.active && jobsLoading;

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
                    patchQueuePublish({
                      error: null,
                      phase: "idle",
                      progress: 0,
                      success: false,
                      active: false,
                      uploadBytesUploaded: 0,
                      uploadBytesTotal: 0,
                      uploadFileIndex: 0,
                      uploadFileCount: 0,
                      publishDone: 0,
                      publishTotal: 0,
                    });
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
                  <ProgressBar value={unifiedProgress} />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    {progressDetail ? (
                      <span className="text-xs text-dashboard-muted">{progressDetail}</span>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs font-semibold tabular-nums text-brand-purple">
                      {Math.round(unifiedProgress)}%
                    </span>
                  </div>
                </div>
                {embeddedRecentJob ? (
                  <div className="border-t border-dashboard-border/60 bg-dashboard-base/25 px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
                    <UploadJobsList variant="recent" jobs={[embeddedRecentJob]} />
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

        {jobsLoading && !hideHistoryLoading ? (
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
