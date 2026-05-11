/** Supabase Storage bucket for temporary wizard creative binaries (see migration `wizard_creatives`). */
export const WIZARD_CREATIVES_BUCKET = "wizard_creatives" as const;

const SESSION_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEGMENT_RE = /^[\w.-]+$/;

/**
 * Ensures paths are owned by `userId`, avoid path traversal, and match expected layout:
 * `{userId}/{sessionUuid}/creative_{n}.{ext}` (at least 3 segments).
 * @returns error message or null if valid.
 */
export function validateCreativeStoragePathsForUser(
  userId: string,
  paths: string[],
  creativeCount: number
): string | null {
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
    if (!SESSION_UUID_RE.test(segments[1])) {
      return "Segmento de sessão inválido no caminho de storage.";
    }
    for (const seg of segments) {
      if (!SEGMENT_RE.test(seg)) {
        return "Caracteres não permitidos no caminho de storage.";
      }
    }
  }
  return null;
}
