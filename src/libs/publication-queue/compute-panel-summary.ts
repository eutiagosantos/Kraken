export type UploadJobSummaryRow = {
  total: number;
  done: number;
  status: string;
  started_at: string;
  finished_at: string | null;
};

export type PublicationQueueSummary = {
  campaignsInQueue: number;
  adsPublishedToday: number;
  connectedAccounts: number;
  nextBatchProgress: number;
  nextBatchEtaSeconds: number | null;
  averageTimeSeconds: number | null;
  isActive: boolean;
};

const IN_FLIGHT = new Set(["awaiting_creatives", "processing"]);

function isToday(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && d.toDateString() === now.toDateString();
}

function jobDurationSeconds(job: UploadJobSummaryRow): number | null {
  if (!job.finished_at) return null;
  const start = Date.parse(job.started_at);
  const end = Date.parse(job.finished_at);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return Math.round((end - start) / 1000);
}

export function computePublicationQueueSummary(
  jobs: UploadJobSummaryRow[],
  connectedAccounts: number,
  now: Date = new Date()
): PublicationQueueSummary {
  const activeJobs = jobs.filter((j) => IN_FLIGHT.has(j.status));
  const isActive = activeJobs.length > 0;

  const campaignsInQueue = activeJobs.reduce(
    (acc, j) => acc + Math.max(0, j.total - j.done),
    0
  );

  const adsPublishedToday = jobs
    .filter((j) => isToday(j.started_at, now))
    .reduce((acc, j) => acc + j.done, 0);

  const primaryActive = activeJobs[0];
  const nextBatchProgress =
    primaryActive && primaryActive.total > 0
      ? Math.round((primaryActive.done / primaryActive.total) * 100)
      : 0;

  const completedDurations = jobs
    .filter((j) => j.status === "completed")
    .map((j) => jobDurationSeconds(j))
    .filter((s): s is number => s !== null)
    .slice(0, 20);

  const averageTimeSeconds =
    completedDurations.length > 0
      ? Math.round(
          completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
        )
      : null;

  let nextBatchEtaSeconds: number | null = null;
  if (primaryActive && primaryActive.total > primaryActive.done && averageTimeSeconds) {
    const remaining = primaryActive.total - primaryActive.done;
    const secPerUnit = averageTimeSeconds / Math.max(primaryActive.total, 1);
    nextBatchEtaSeconds = Math.max(1, Math.round(remaining * secPerUnit));
  }

  return {
    campaignsInQueue,
    adsPublishedToday,
    connectedAccounts,
    nextBatchProgress,
    nextBatchEtaSeconds,
    averageTimeSeconds,
    isActive,
  };
}

export function formatEtaLabel(seconds: number | null): string | null {
  if (seconds === null) return null;
  if (seconds < 60) return `~${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `~${m}m ${s}s` : `~${m}m`;
}

export function formatDurationLabel(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatPanelNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}
