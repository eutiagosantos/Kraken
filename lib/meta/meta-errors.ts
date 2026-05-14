import { GraphApiError } from "@/lib/meta/graph-client";

export type ParsedMetaError = {
  message: string;
  code?: number;
  subcode?: number;
  fbtraceId?: string;
  errorUserTitle?: string;
  errorUserMsg?: string;
  rawBodySnippet?: string;
};

export type ClassifiedMetaError = ParsedMetaError & {
  /** Texto seguro para mostrar ao utilizador */
  friendlyMessage: string;
  retryable: boolean;
  fatal: boolean;
};

/** Extrai campos úteis de uma resposta JSON de erro Graph (string body). */
export function parseMetaErrorBody(rawBody: string): ParsedMetaError {
  try {
    const j = JSON.parse(rawBody) as {
      error?: {
        message?: string;
        code?: number;
        error_subcode?: number;
        fbtrace_id?: string;
        error_user_title?: string;
        error_user_msg?: string;
      };
    };
    const e = j.error;
    if (!e || typeof e !== "object") {
      return { message: rawBody.slice(0, 400) };
    }
    const msg = typeof e.message === "string" ? e.message.trim() : "";
    const userMsg = typeof e.error_user_msg === "string" ? e.error_user_msg.trim() : undefined;
    return {
      message: msg || userMsg || rawBody.slice(0, 400),
      code: typeof e.code === "number" ? e.code : undefined,
      subcode: typeof e.error_subcode === "number" ? e.error_subcode : undefined,
      fbtraceId: typeof e.fbtrace_id === "string" ? e.fbtrace_id : undefined,
      errorUserTitle: typeof e.error_user_title === "string" ? e.error_user_title : undefined,
      errorUserMsg: userMsg,
      rawBodySnippet: rawBody.length <= 800 ? rawBody : `${rawBody.slice(0, 800)}…`,
    };
  } catch {
    return { message: rawBody.slice(0, 400) };
  }
}

function isRetryableHttp(status: number): boolean {
  return status === 429 || status === 408 || (status >= 500 && status < 600);
}

/** Heurística: erros temporários de rate / servidor / throttling. */
function isRetryableGraphCode(code?: number, subcode?: number): boolean {
  if (code === 1) return true; // API unknown — often transient
  if (code === 2) return true; // Service temporarily unavailable
  if (code === 4) return true; // Application request limit (sometimes)
  if (code === 17) return true; // User request limit
  if (code === 341) return true; // Application limit
  if (subcode === 99 || subcode === 1500) return true; // throttling variants
  return false;
}

/**
 * Classifica qualquer erro lançado pela stack Meta/Graph.
 * `GraphApiError` já traz code/subcode/user messages; outros caem em mensagem genérica.
 */
export function parseMetaError(err: unknown): ClassifiedMetaError {
  if (err instanceof GraphApiError) {
    const parsed: ParsedMetaError = {
      message: err.message,
      code: err.graphCode,
      subcode: err.errorSubcode,
      fbtraceId: err.fbtraceId,
      errorUserTitle: err.errorUserTitle,
      errorUserMsg: err.errorUserMsg,
      rawBodySnippet: err.rawBody.length <= 800 ? err.rawBody : `${err.rawBody.slice(0, 800)}…`,
    };
    const retryable = isRetryableHttp(err.status) || isRetryableGraphCode(err.graphCode, err.errorSubcode);
    const fatal = !retryable && err.status >= 400 && err.status < 500;
    const friendly =
      err.errorUserMsg?.trim() ||
      err.errorUserTitle?.trim() ||
      err.message ||
      "Pedido ao Meta falhou.";
    return { ...parsed, friendlyMessage: friendly, retryable, fatal };
  }
  if (err instanceof Error) {
    return {
      message: err.message,
      friendlyMessage: err.message,
      retryable: false,
      fatal: true,
    };
  }
  return {
    message: String(err),
    friendlyMessage: "Erro desconhecido ao contactar o Meta.",
    retryable: false,
    fatal: true,
  };
}
