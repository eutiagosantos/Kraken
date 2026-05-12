import { GraphApiError } from "@/lib/meta/graph-client";

const META_APP_DEV_MODE_HINT_PT =
  "A app Meta usada no login (Facebook) está em modo Desenvolvimento. Para publicar anúncios reais: em developers.facebook.com, abre a app do Kraken e muda o modo para Live; confirma permissões (ads_management, páginas, etc.) e verificação comercial se a Meta pedir. Para testes com a app em Dev: usa conta de anúncios de teste, página e utilizador com papel Admin/Developer/Tester nessa app.";

function combinedGraphText(e: GraphApiError): string {
  const title = e.errorUserTitle?.trim() ?? "";
  const msg = e.message?.trim() ?? "";
  if (title && msg) return `${title}: ${msg}`;
  return msg || title;
}

/**
 * True when `text` looks like Meta’s “app in development mode” rejection or the
 * Kraken humanized message built from it (used client-side on publish error strings).
 */
export function messageIndicatesMetaAppDevelopmentMode(text: string): boolean {
  const blob = text.toLowerCase();
  return (
    blob.includes("modo de desenvolvimento") ||
    blob.includes("development mode") ||
    (blob.includes("created by an app") && blob.includes("development")) ||
    blob.includes("app meta usada no login")
  );
}

/** When Meta rejects creatives because the OAuth app is still in Development mode. */
export function isMetaAppDevelopmentModeError(e: unknown): boolean {
  if (!(e instanceof GraphApiError)) return false;
  return messageIndicatesMetaAppDevelopmentMode(combinedGraphText(e));
}

/** Actionable PT message + original Meta text for support. */
export function humanizeMetaAppDevelopmentModeError(e: GraphApiError): string {
  return `${META_APP_DEV_MODE_HINT_PT} (resposta Meta: ${combinedGraphText(e)})`;
}

/**
 * Appends a short PT hint for common Meta video processing failures (codec, duration, size).
 * Callers should pass Meta's own `processing_phase.errors[].message` when available.
 */
export function humanizeVideoProcessingError(metaErrorMessage: string): string {
  const m = metaErrorMessage.trim();
  const lower = m.toLowerCase();
  let hint = "";
  if (/codec|format|container|unsupported|invalid.*video|corrupt|encoding|decode|incompatible/i.test(lower)) {
    hint =
      " Sugestão: MP4 com H.264 (vídeo) e AAC (áudio), evita codecs ou contentores pouco suportados.";
  } else if (/duration|length|too long|too short|seconds|minute/i.test(lower)) {
    hint = " Sugestão: confirma a duração e os limites da Meta para o formato/placement escolhido.";
  } else if (/size|file|large|exceed|mb|gb|bitrate|resolution|dimension|pixels/i.test(lower)) {
    hint = " Sugestão: reduz resolução, bitrate ou tamanho do ficheiro dentro dos limites da Meta.";
  }
  return m ? `${m}${hint}` : `Erro no processamento do vídeo.${hint}`.trim();
}
