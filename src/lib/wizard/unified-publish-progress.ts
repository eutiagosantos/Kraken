export type PublishProgressEvent =
  | { kind: "preparing" }
  | {
      kind: "upload";
      bytesUploaded: number;
      bytesTotal: number;
      fileIndex: number;
      fileCount: number;
    }
  | { kind: "publishing"; done?: number; total?: number }
  | { kind: "catalog" }
  | { kind: "done" };

/** Fases visíveis no cartão «Envio recente» (uma única barra de progresso). */
export type PublishQueuePhase =
  | "idle"
  | "preparing"
  | "uploading"
  | "publishing"
  | "done"
  | "error";

/** Progresso até aqui antes da faixa de upload TUS (init). */
export const PREPARING_PROGRESS_PERCENT = 5;

/** Início da faixa Meta (`upload_jobs.done/total`). */
export const PUBLISH_PROGRESS_BASE_PERCENT = 40;

/** Fim da faixa de upload de criativos (antes de publicar no Meta). */
export const UPLOAD_PROGRESS_MAX_PERCENT = PUBLISH_PROGRESS_BASE_PERCENT;

const UPLOAD_RANGE = UPLOAD_PROGRESS_MAX_PERCENT - PREPARING_PROGRESS_PERCENT;
const PUBLISH_RANGE = 100 - PUBLISH_PROGRESS_BASE_PERCENT;

export type UnifiedPublishProgressInput = {
  phase: PublishQueuePhase;
  uploadBytesUploaded: number;
  uploadBytesTotal: number;
  publishDone: number;
  publishTotal: number;
  /** Ficheiro actual durante TUS (1-based para UI). */
  uploadFileIndex?: number;
  uploadFileCount?: number;
};

export function uploadRatio(bytesUploaded: number, bytesTotal: number): number {
  if (bytesTotal <= 0) return 0;
  return Math.min(1, Math.max(0, bytesUploaded / bytesTotal));
}

export function publishRatio(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, done / total));
}

/**
 * Barra única 0–100: preparação (~5%) → upload TUS (5–40%) → Meta (40–100%).
 */
export function computeUnifiedPublishProgress(input: UnifiedPublishProgressInput): number {
  const { phase, uploadBytesUploaded, uploadBytesTotal, publishDone, publishTotal } = input;

  if (phase === "done") return 100;
  if (phase === "idle" || phase === "error") return 0;
  if (phase === "preparing") return PREPARING_PROGRESS_PERCENT;

  if (phase === "uploading") {
    const ratio = uploadRatio(uploadBytesUploaded, uploadBytesTotal);
    return Math.round(PREPARING_PROGRESS_PERCENT + ratio * UPLOAD_RANGE);
  }

  if (phase === "publishing") {
    if (publishTotal > 0) {
      const ratio = publishRatio(publishDone, publishTotal);
      const raw = PUBLISH_PROGRESS_BASE_PERCENT + ratio * PUBLISH_RANGE;
      if (publishDone >= publishTotal) return 99;
      return Math.min(99, Math.round(raw));
    }
    return PUBLISH_PROGRESS_BASE_PERCENT;
  }

  return 0;
}

export function publishPhaseLabelPt(input: UnifiedPublishProgressInput): string {
  const { phase, uploadFileIndex, uploadFileCount, publishDone, publishTotal } = input;

  switch (phase) {
    case "preparing":
      return "A preparar o envio…";
    case "uploading": {
      const fileHint =
        uploadFileCount != null &&
        uploadFileCount > 0 &&
        uploadFileIndex != null &&
        uploadFileIndex >= 1
          ? ` (${uploadFileIndex}/${uploadFileCount})`
          : "";
      return `A enviar criativos${fileHint}…`;
    }
    case "publishing":
      if (publishTotal > 0) {
        return `A publicar no Meta (${publishDone}/${publishTotal})…`;
      }
      return "A publicar campanhas no Meta…";
    case "done":
      return "Concluído.";
    case "error":
      return "Erro no envio.";
    default:
      return "Envio em curso…";
  }
}

/** Sincroniza `upload_jobs` (servidor) com a fase `publishing` quando o job já está a processar. */
export function serverJobToPublishProgress(job: {
  status: string;
  done: number;
  total: number;
}): Pick<UnifiedPublishProgressInput, "phase" | "publishDone" | "publishTotal"> {
  if (job.status === "processing" || job.status === "completed") {
    return {
      phase: job.status === "completed" ? "done" : "publishing",
      publishDone: job.done,
      publishTotal: job.total,
    };
  }
  return { phase: "publishing", publishDone: 0, publishTotal: 0 };
}

export type QueuePublishProgressFields = {
  phase: PublishQueuePhase;
  progress: number;
  uploadBytesUploaded: number;
  uploadBytesTotal: number;
  uploadFileIndex: number;
  uploadFileCount: number;
  publishDone: number;
  publishTotal: number;
};

/** Converte evento do adapter em campos do `queuePublish` + percentagem unificada. */
export function queuePublishFieldsFromProgressEvent(
  event: PublishProgressEvent,
  prev: QueuePublishProgressFields
): QueuePublishProgressFields {
  let phase: PublishQueuePhase = prev.phase;
  let uploadBytesUploaded = prev.uploadBytesUploaded;
  let uploadBytesTotal = prev.uploadBytesTotal;
  let uploadFileIndex = prev.uploadFileIndex;
  let uploadFileCount = prev.uploadFileCount;
  let publishDone = prev.publishDone;
  let publishTotal = prev.publishTotal;

  switch (event.kind) {
    case "preparing":
      phase = "preparing";
      break;
    case "upload":
      phase = "uploading";
      uploadBytesUploaded = event.bytesUploaded;
      uploadBytesTotal = event.bytesTotal;
      uploadFileIndex = event.fileIndex;
      uploadFileCount = event.fileCount;
      break;
    case "publishing":
      phase = "publishing";
      if (event.done != null) publishDone = event.done;
      if (event.total != null) publishTotal = event.total;
      break;
    case "catalog":
      phase = "publishing";
      publishDone = 0;
      publishTotal = 0;
      break;
    case "done":
      phase = "done";
      break;
    default:
      break;
  }

  const input: UnifiedPublishProgressInput = {
    phase,
    uploadBytesUploaded,
    uploadBytesTotal,
    publishDone,
    publishTotal,
    uploadFileIndex: uploadFileIndex > 0 ? uploadFileIndex : undefined,
    uploadFileCount: uploadFileCount > 0 ? uploadFileCount : undefined,
  };

  return {
    phase,
    uploadBytesUploaded,
    uploadBytesTotal,
    uploadFileIndex,
    uploadFileCount,
    publishDone,
    publishTotal,
    progress: computeUnifiedPublishProgress(input),
  };
}
