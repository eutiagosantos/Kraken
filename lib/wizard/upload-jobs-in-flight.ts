import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/** Estados que bloqueiam um novo `publish/init` para o mesmo utilizador. */
export const UPLOAD_JOB_IN_FLIGHT_STATUSES = ["awaiting_creatives", "processing"] as const;

export type UploadJobInFlightStatus = (typeof UPLOAD_JOB_IN_FLIGHT_STATUSES)[number];

export function isUploadJobInFlightStatus(status: string): status is UploadJobInFlightStatus {
  return (UPLOAD_JOB_IN_FLIGHT_STATUSES as readonly string[]).includes(status);
}

export const PUBLISH_INIT_CONFLICT_PT =
  "Já existe um envio em curso. Aguarda que termine ou visita a fila de processamento antes de iniciar outro.";

/**
 * Devolve o id do primeiro `upload_jobs` em curso para o utilizador, ou `null`.
 *
 * TODO(batch): quando a fila permitir lote explícito (vários IDs / cabeçalho dedicado),
 * ajustar esta regra para não bloquear o init dos jobs incluídos no lote.
 */
export type InFlightUploadJobCheck =
  | { ok: true; blockingId: string | null }
  | { ok: false; message: string };

export async function checkInFlightUploadJob(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<InFlightUploadJobCheck> {
  const { data, error } = await supabase
    .from("upload_jobs")
    .select("id")
    .eq("user_id", userId)
    .in("status", [...UPLOAD_JOB_IN_FLIGHT_STATUSES])
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[upload_jobs] in-flight check:", error.message);
    return { ok: false, message: error.message };
  }
  return { ok: true, blockingId: data?.id ?? null };
}

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
