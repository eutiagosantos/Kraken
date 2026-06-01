import "server-only";

import { findInFlightUploadJobId } from "@/libs/database/queries/upload-jobs";

export type InFlightUploadJobCheck =
  | { ok: true; blockingId: string | null }
  | { ok: false; message: string };

/**
 * Devolve o id do primeiro `upload_jobs` em curso para o utilizador, ou `null`.
 *
 * TODO(batch): quando a fila permitir lote explícito (vários IDs / cabeçalho dedicado),
 * ajustar esta regra para não bloquear o init dos jobs incluídos no lote.
 */
export async function checkInFlightUploadJob(userId: string): Promise<InFlightUploadJobCheck> {
  try {
    const blockingId = await findInFlightUploadJobId(userId);
    return { ok: true, blockingId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "upload_jobs_in_flight_check_failed";
    console.warn("[upload_jobs] in-flight check:", message);
    return { ok: false, message };
  }
}
