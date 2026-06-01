/** Supabase Storage bucket for temporary wizard creative binaries (see migration `wizard_creatives`). */
export const WIZARD_CREATIVES_BUCKET = "wizard_creatives" as const;

const STORAGE_OBJECT_NOT_FOUND_HINT_PT =
  "Confirma no Supabase (Storage → bucket «wizard_creatives») que a migração `wizard_creatives` está aplicada, que o envio TUS terminou sem erros e que `NEXT_PUBLIC_SUPABASE_URL` é o mesmo no browser e no servidor. Volta a escolher os ficheiros e publica de novo.";

/**
 * Turns opaque Storage API messages into actionable PT text for wizard publish downloads.
 */
export function humanizeWizardCreativeStorageDownloadError(path: string, message: string | undefined): string {
  const m = (message ?? "").trim();
  const lower = m.toLowerCase();
  if (lower === "object not found" || /\bnot found\b/i.test(m)) {
    return `Não foi encontrado o criativo no armazenamento em «${path}». ${STORAGE_OBJECT_NOT_FOUND_HINT_PT}`;
  }
  if (m) {
    return `Não foi possível descarregar o criativo em «${path}»: ${m}`;
  }
  return `Não foi possível descarregar o criativo em «${path}». ${STORAGE_OBJECT_NOT_FOUND_HINT_PT}`;
}

const SESSION_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEGMENT_RE = /^[\w.-]+$/;

/**
 * Ensures paths are owned by `userId`, avoid path traversal, and match expected layout:
 * `{userId}/{publishOperationId}/creative_{n}.{ext}` (at least 3 segments).
 * @returns error message or null if valid.
 */
export function validateCreativeStoragePathsForUser(
  userId: string,
  paths: string[],
  creativeCount: number,
  publishOperationId: string
): string | null {
  if (!publishOperationId || !SESSION_UUID_RE.test(publishOperationId)) {
    return "publishOperationId inválido.";
  }
  if (paths.length !== creativeCount) {
    return "creativeStoragePaths deve ter o mesmo número de entradas que creatives.";
  }
  for (const path of paths) {
    if (!path || path.includes("..") || path.startsWith("/")) {
      return "Caminho de storage inválido.";
    }
    const segments = path.split("/").filter((s) => s.length > 0);
    if (segments.length < 3) {
      return "Caminho de storage incompleto.";
    }
    if (segments[0] !== userId) {
      return "Caminhos de storage devem pertencer ao utilizador autenticado.";
    }
    if (segments[1] !== publishOperationId) {
      return "Caminhos de storage não correspondem ao publishOperationId.";
    }
    for (const seg of segments) {
      if (!SEGMENT_RE.test(seg)) {
        return "Caracteres não permitidos no caminho de storage.";
      }
    }
  }
  return null;
}
