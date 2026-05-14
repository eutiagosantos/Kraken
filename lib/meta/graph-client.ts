import { META_GRAPH_ORIGIN } from "@/lib/meta/constants";
import { GraphApiError } from "@/lib/meta/graph-api-error";
import { computeMetaAppSecretProof, metaAppSecretFromEnv } from "@/lib/meta/meta-app-secret-proof";

export type GraphFetch = typeof fetch;

export { GraphApiError };

function parseGraphErrorJson(body: string): {
  message: string;
  code?: number;
  errorSubcode?: number;
  errorUserTitle?: string;
  errorUserMsg?: string;
  errorDataSummary?: string;
  fbtraceId?: string;
} {
  try {
    const j = JSON.parse(body) as {
      error?: {
        message?: string;
        code?: number;
        error_subcode?: number;
        error_user_title?: string;
        error_user_msg?: string;
        error_data?: unknown;
        fbtrace_id?: string;
      };
    };
    const e = j.error;
    if (e) {
      let errorDataSummary: string | undefined;
      if (e.error_data != null) {
        try {
          const s = typeof e.error_data === "string" ? e.error_data : JSON.stringify(e.error_data);
          if (s.length > 0) {
            errorDataSummary = s.length <= 600 ? s : `${s.slice(0, 600)}…`;
          }
        } catch {
          /* ignore */
        }
      }
      const msg = e.message?.trim();
      const userMsg = typeof e.error_user_msg === "string" ? e.error_user_msg.trim() : undefined;
      const message = msg || userMsg || body.slice(0, 400);
      return {
        message,
        code: typeof e.code === "number" ? e.code : undefined,
        errorSubcode: typeof e.error_subcode === "number" ? e.error_subcode : undefined,
        errorUserTitle: typeof e.error_user_title === "string" ? e.error_user_title : undefined,
        errorUserMsg: userMsg,
        errorDataSummary,
        fbtraceId: typeof e.fbtrace_id === "string" && e.fbtrace_id.trim() ? e.fbtrace_id.trim() : undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return { message: body.slice(0, 400) };
}

/** Appends `access_token` and optional `appsecret_proof` when `META_APP_SECRET` is set (server). */
export function attachGraphAccessTokenToUrl(url: URL, accessToken: string): void {
  url.searchParams.set("access_token", accessToken);
  const secret = metaAppSecretFromEnv();
  if (secret) {
    url.searchParams.set("appsecret_proof", computeMetaAppSecretProof(accessToken, secret));
  }
}

export function graphUrl(path: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${META_GRAPH_ORIGIN}/${p}`;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function graphJsonPost<T = unknown>(options: {
  path: string;
  accessToken: string;
  body: Record<string, unknown>;
  fetchImpl?: GraphFetch;
}): Promise<T> {
  const fetchFn = options.fetchImpl ?? fetch;
  const url = new URL(graphUrl(options.path));
  attachGraphAccessTokenToUrl(url, options.accessToken);

  let lastErr: GraphApiError | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetchFn(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options.body),
    });
    const raw = await res.text();

    if (res.status === 429 && attempt < 2) {
      await sleep(400 * (attempt + 1));
      continue;
    }

    if (!res.ok) {
      const parsed = parseGraphErrorJson(raw);
      lastErr = new GraphApiError(parsed.message || `Graph HTTP ${res.status}`, {
        status: res.status,
        graphCode: parsed.code,
        errorSubcode: parsed.errorSubcode,
        errorUserTitle: parsed.errorUserTitle,
        errorUserMsg: parsed.errorUserMsg,
        errorDataSummary: parsed.errorDataSummary,
        fbtraceId: parsed.fbtraceId,
        rawBody: raw,
      });
      if (res.status >= 500 && attempt < 2) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      throw lastErr;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new GraphApiError("Resposta Graph inválida (não JSON).", {
        status: res.status,
        rawBody: raw.slice(0, 400),
      });
    }
  }
  throw lastErr ?? new GraphApiError("Graph: falha após retries.", { status: 0, rawBody: "" });
}

export async function graphJsonGet<T = unknown>(options: {
  path: string;
  accessToken: string;
  searchParams?: Record<string, string>;
  fetchImpl?: GraphFetch;
}): Promise<T> {
  const fetchFn = options.fetchImpl ?? fetch;
  const url = new URL(graphUrl(options.path));
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  attachGraphAccessTokenToUrl(url, options.accessToken);
  const res = await fetchFn(url.toString(), { method: "GET" });
  const raw = await res.text();
  if (!res.ok) {
    const parsed = parseGraphErrorJson(raw);
    throw new GraphApiError(parsed.message || `Graph GET HTTP ${res.status}`, {
      status: res.status,
      graphCode: parsed.code,
      errorSubcode: parsed.errorSubcode,
      errorUserTitle: parsed.errorUserTitle,
      errorUserMsg: parsed.errorUserMsg,
      errorDataSummary: parsed.errorDataSummary,
      fbtraceId: parsed.fbtraceId,
      rawBody: raw,
    });
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new GraphApiError("Resposta Graph inválida (não JSON).", {
      status: res.status,
      rawBody: raw.slice(0, 400),
    });
  }
}

/** DELETE `/{object-id}` (e.g. campaign) — best-effort cleanup; failures are ignored by callers. */
export async function graphDelete(options: {
  /** Graph path without leading slash, e.g. numeric campaign id */
  path: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
}): Promise<void> {
  const fetchFn = options.fetchImpl ?? fetch;
  const url = new URL(graphUrl(options.path));
  attachGraphAccessTokenToUrl(url, options.accessToken);
  const res = await fetchFn(url.toString(), { method: "DELETE" });
  const raw = await res.text();
  if (!res.ok) {
    const parsed = parseGraphErrorJson(raw);
    throw new GraphApiError(parsed.message || `Graph DELETE HTTP ${res.status}`, {
      status: res.status,
      graphCode: parsed.code,
      errorSubcode: parsed.errorSubcode,
      errorUserTitle: parsed.errorUserTitle,
      errorUserMsg: parsed.errorUserMsg,
      errorDataSummary: parsed.errorDataSummary,
      fbtraceId: parsed.fbtraceId,
      rawBody: raw,
    });
  }
}

export async function graphFormPost<T = unknown>(options: {
  path: string;
  accessToken: string;
  formData: FormData;
  fetchImpl?: GraphFetch;
}): Promise<T> {
  const fetchFn = options.fetchImpl ?? fetch;
  const url = new URL(graphUrl(options.path));
  attachGraphAccessTokenToUrl(url, options.accessToken);

  const res = await fetchFn(url.toString(), { method: "POST", body: options.formData });
  const raw = await res.text();
  if (!res.ok) {
    const parsed = parseGraphErrorJson(raw);
    throw new GraphApiError(parsed.message || `Graph HTTP ${res.status}`, {
      status: res.status,
      graphCode: parsed.code,
      errorSubcode: parsed.errorSubcode,
      errorUserTitle: parsed.errorUserTitle,
      errorUserMsg: parsed.errorUserMsg,
      errorDataSummary: parsed.errorDataSummary,
      fbtraceId: parsed.fbtraceId,
      rawBody: raw,
    });
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new GraphApiError("Resposta Graph inválida (não JSON).", { status: res.status, rawBody: raw.slice(0, 400) });
  }
}
