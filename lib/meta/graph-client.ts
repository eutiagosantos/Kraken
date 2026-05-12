import { META_GRAPH_ORIGIN } from "@/lib/meta/constants";

export type GraphFetch = typeof fetch;

export class GraphApiError extends Error {
  readonly status: number;
  readonly graphCode?: number;
  readonly errorSubcode?: number;
  readonly errorUserTitle?: string;
  readonly rawBody: string;

  constructor(
    message: string,
    opts: { status: number; graphCode?: number; errorSubcode?: number; errorUserTitle?: string; rawBody: string }
  ) {
    super(message);
    this.name = "GraphApiError";
    this.status = opts.status;
    this.graphCode = opts.graphCode;
    this.errorSubcode = opts.errorSubcode;
    this.errorUserTitle = opts.errorUserTitle;
    this.rawBody = opts.rawBody;
  }
}

function parseGraphErrorJson(body: string): { message: string; code?: number; errorSubcode?: number; errorUserTitle?: string } {
  try {
    const j = JSON.parse(body) as {
      error?: { message?: string; code?: number; error_subcode?: number; error_user_title?: string };
    };
    const e = j.error;
    if (e?.message) {
      return {
        message: e.message,
        code: typeof e.code === "number" ? e.code : undefined,
        errorSubcode: typeof e.error_subcode === "number" ? e.error_subcode : undefined,
        errorUserTitle: typeof e.error_user_title === "string" ? e.error_user_title : undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return { message: body.slice(0, 400) };
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
  url.searchParams.set("access_token", options.accessToken);

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
  url.searchParams.set("access_token", options.accessToken);
  const res = await fetchFn(url.toString(), { method: "GET" });
  const raw = await res.text();
  if (!res.ok) {
    const parsed = parseGraphErrorJson(raw);
    throw new GraphApiError(parsed.message || `Graph GET HTTP ${res.status}`, {
      status: res.status,
      graphCode: parsed.code,
      errorSubcode: parsed.errorSubcode,
      errorUserTitle: parsed.errorUserTitle,
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
  url.searchParams.set("access_token", options.accessToken);
  const res = await fetchFn(url.toString(), { method: "DELETE" });
  const raw = await res.text();
  if (!res.ok) {
    const parsed = parseGraphErrorJson(raw);
    throw new GraphApiError(parsed.message || `Graph DELETE HTTP ${res.status}`, {
      status: res.status,
      graphCode: parsed.code,
      errorSubcode: parsed.errorSubcode,
      errorUserTitle: parsed.errorUserTitle,
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
  url.searchParams.set("access_token", options.accessToken);

  const res = await fetchFn(url.toString(), { method: "POST", body: options.formData });
  const raw = await res.text();
  if (!res.ok) {
    const parsed = parseGraphErrorJson(raw);
    throw new GraphApiError(parsed.message || `Graph HTTP ${res.status}`, {
      status: res.status,
      graphCode: parsed.code,
      errorSubcode: parsed.errorSubcode,
      errorUserTitle: parsed.errorUserTitle,
      rawBody: raw,
    });
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new GraphApiError("Resposta Graph inválida (não JSON).", { status: res.status, rawBody: raw.slice(0, 400) });
  }
}
