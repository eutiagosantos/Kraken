import { GraphApiError } from "@/lib/meta/graph-client";

const META_APP_DEV_MODE_HINT_PT =
  "A app Meta usada no login (Facebook) está em modo Desenvolvimento. Para publicar anúncios reais: em developers.facebook.com, abre a app do Kraken e muda o modo para Live; confirma permissões (ads_management, páginas, etc.) e verificação comercial se a Meta pedir. Para testes com a app em Dev: usa conta de anúncios de teste, página e utilizador com papel Admin/Developer/Tester nessa app.";

function combinedGraphText(e: GraphApiError): string {
  const title = e.errorUserTitle?.trim() ?? "";
  const msg = e.message?.trim() ?? "";
  const userMsg = e.errorUserMsg?.trim() ?? "";
  let core = title && msg ? `${title}: ${msg}` : msg || title;
  if (userMsg && !core.includes(userMsg)) {
    core = core ? `${core} — ${userMsg}` : userMsg;
  }
  return core;
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

const META_AUDIENCE_TOO_NARROW_HINT_PT =
  "O Meta estimou este público como demasiado pequeno ou inelegível para veicular. Alarga a faixa etária, os placements e os dispositivos; simplifica ou remove interesses. Em localização, alarga o conjunto: só país(és) no assistente, ou várias cidades/estados sem misturar com país na mesma lista. Um teste útil: país (ex.: BR) só + idades amplas + sem interesses — se passar, volta a estreitar até encontrar o filtro problemático.";

/** Meta often returns PT/EN variants of “expand your audience” on ad set creation. */
export function isMetaAudienceTooNarrowError(e: unknown): boolean {
  if (!(e instanceof GraphApiError)) return false;
  const blob = combinedGraphText(e).toLowerCase();
  if (blob.includes("expand your audience") || blob.includes("broaden your audience")) return true;
  if (blob.includes("amplie") && blob.includes("público")) return true;
  if (blob.includes("ampliar") && blob.includes("público")) return true;
  return false;
}

export function humanizeMetaAudienceTooNarrowError(e: GraphApiError): string {
  return `${META_AUDIENCE_TOO_NARROW_HINT_PT} (resposta Meta: ${combinedGraphText(e)})`;
}

const META_DETAILED_TARGETING_INVALID_HINT_PT =
  "No passo Público, remove os interesses antigos e volta a escolhê-los com «Buscar interesses» (a pesquisa usa dados actuais da Meta). Se usas públicos guardados, edita-os para actualizar interesses e localização.";

/** Meta rejects ad set `targeting` when detailed targeting options are invalid or deprecated without a machine-readable alternative in the response. */
export function isMetaDetailedTargetingInvalidParameterError(e: unknown): boolean {
  if (!(e instanceof GraphApiError)) return false;
  const blob = combinedGraphText(e).toLowerCase();
  const raw = (e.rawBody ?? "").toLowerCase();
  const mentionsDetailed =
    blob.includes("direcionamento detalhado") ||
    blob.includes("detailed targeting") ||
    blob.includes("especificação de direcionamento") ||
    blob.includes("targeting specification") ||
    blob.includes("atualize a especificação de direcionamento") ||
    blob.includes("update the targeting specification");
  const invalidParam =
    blob.includes("invalid parameter") ||
    e.message.toLowerCase().includes("invalid parameter") ||
    raw.includes("invalid parameter");
  return mentionsDetailed && invalidParam;
}

export function humanizeMetaDetailedTargetingInvalidError(e: GraphApiError): string {
  return `${META_DETAILED_TARGETING_INVALID_HINT_PT} (resposta Meta: ${combinedGraphText(e)})`;
}

const META_BILLING_UNAVAILABLE_HINT_PT =
  "A conta de anúncios ainda não tem acesso a esta opção de cobrança (conforme o mapa oficial da Meta). O Meta libera gradualmente para contas novas. Enquanto isso, a publicação será retentada automaticamente com cobrança POST_ENGAGEMENT e objetivo POST_ENGAGEMENT; se voltar a falhar, aguarda algumas semanas até a conta consolidar histórico no Meta.";

const META_BILLING_BOTH_FAILED_HINT_PT =
  "A conta de anúncios não tem acesso à cobrança prevista nem ao fallback POST_ENGAGEMENT para contas novas. O Meta libera estas opções gradualmente — aguarda algumas semanas até a conta consolidar histórico no Meta.";

/** Meta rejects ad set `billing_event` when the account is new and the chosen billing option is restricted. */
export function isMetaBillingUnavailableError(e: unknown): boolean {
  if (!(e instanceof GraphApiError)) return false;
  const blob = combinedGraphText(e).toLowerCase();
  return (
    (blob.includes("cobrança") && blob.includes("indisponível")) ||
    (blob.includes("billing") && blob.includes("unavailable")) ||
    blob.includes("empresas novas") ||
    blob.includes("seguirem nossas políticas por várias semanas")
  );
}

export function humanizeMetaBillingUnavailableError(e: GraphApiError): string {
  return `${META_BILLING_UNAVAILABLE_HINT_PT} (resposta Meta: ${combinedGraphText(e)})`;
}

export function humanizeMetaBillingBothFailedError(e: GraphApiError): string {
  return `${META_BILLING_BOTH_FAILED_HINT_PT} (resposta Meta: ${combinedGraphText(e)})`;
}

const META_OBJECT_NOT_FOUND_HINT_PT =
  "Normalmente indica um ID inválido ou sem permissão: conta de anúncios, página, pixel, conjunto de anúncios ou recurso referenciado no pedido. Verifica no assistente a página e as contas seleccionadas; reconecta o Meta se mudaste permissões.";

/** Meta Graph sometimes returns a bare «Object not found» when an edge ID does not exist or is inaccessible. */
export function isMetaObjectNotFoundError(e: unknown): boolean {
  if (!(e instanceof GraphApiError)) return false;
  const blob = `${combinedGraphText(e)} ${e.rawBody ?? ""}`.toLowerCase();
  return blob.includes("object not found");
}

export function humanizeMetaObjectNotFoundError(e: GraphApiError): string {
  return `${META_OBJECT_NOT_FOUND_HINT_PT} (resposta Meta: ${combinedGraphText(e)})`;
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
