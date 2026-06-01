/** Estados que bloqueiam um novo `publish/init` para o mesmo utilizador. */
export const UPLOAD_JOB_IN_FLIGHT_STATUSES = ["awaiting_creatives", "processing"] as const;

export type UploadJobInFlightStatus = (typeof UPLOAD_JOB_IN_FLIGHT_STATUSES)[number];

export function isUploadJobInFlightStatus(status: string): status is UploadJobInFlightStatus {
  return (UPLOAD_JOB_IN_FLIGHT_STATUSES as readonly string[]).includes(status);
}

/** Stop auto-polling rows stuck in-flight longer than this (abandoned init, backend bug, clock skew). */
export const UPLOAD_JOB_POLL_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** True when the job is in a Meta-facing in-flight status and young enough to keep polling for updates. */
export function uploadJobShouldPollForUpdates<T extends { status: string; started_at: string }>(
  job: T,
  nowMs: number = Date.now()
): boolean {
  if (!isUploadJobInFlightStatus(job.status)) return false;
  const started = Date.parse(job.started_at);
  if (Number.isNaN(started)) return true;
  return nowMs - started <= UPLOAD_JOB_POLL_MAX_AGE_MS;
}

export const PUBLISH_INIT_CONFLICT_PT =
  "Já existe um envio em curso. Aguarda que termine ou visita a fila de processamento antes de iniciar outro.";

export function partitionUploadJobsByActive<T extends { id: string; status: string; started_at: string }>(
  jobs: T[]
): { activeJobs: T[]; historyJobs: T[] } {
  const activeJobs = jobs
    .filter((j) => isUploadJobInFlightStatus(j.status))
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  const activeIds = new Set(activeJobs.map((j) => j.id));
  const historyJobs = jobs.filter((j) => !activeIds.has(j.id));
  return { activeJobs, historyJobs };
}
