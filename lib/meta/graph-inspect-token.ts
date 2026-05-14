import { META_GRAPH_ORIGIN } from "@/lib/meta/constants";

export const REQUIRED_TOKEN_SCOPES = [
  "ads_management",
  "ads_read",
  "pages_show_list",
  "pages_manage_ads",
  "pages_read_engagement",
  "pages_read_user_content",
  "pages_manage_posts",
] as const;

/** Page access tokens from `/me/accounts` often omit ad-account scopes; use this for Graph calls that only need Page permissions. */
export const REQUIRED_PAGE_TOKEN_SCOPES_FOR_ENGAGEMENT_POSTS = [
  "pages_show_list",
  "pages_manage_ads",
  "pages_read_engagement",
  "pages_read_user_content",
] as const;

export type InspectTokenScopesOptions = {
  requiredScopes?: readonly string[];
};

export type InspectTokenResult =
  | { valid: false; error: string }
  | { valid: true; scopes: string[]; missingScopes: string[] };

/** Parsed `data` object from `GET /debug_token` (inner payload, not the HTTP wrapper). */
export type DebugTokenData = {
  isValid: boolean;
  type?: string;
  profileId?: string;
  scopes: string[];
  errorMessage?: string;
};

function stringFromDebugField(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  return undefined;
}

/** Maps the `data` field of the debug_token JSON response. */
export function parseDebugTokenPayload(data: Record<string, unknown> | null | undefined): DebugTokenData {
  if (!data || typeof data !== "object") {
    return { isValid: false, scopes: [], errorMessage: "Resposta debug_token sem dados." };
  }
  const isValid = data.is_valid === true;
  const rawScopes = data.scopes;
  const scopes = Array.isArray(rawScopes)
    ? rawScopes.filter((s): s is string => typeof s === "string" && s.length > 0)
    : [];
  const type = stringFromDebugField(data.type);
  const profileId = stringFromDebugField(data.profile_id);
  let errorMessage: string | undefined;
  const err = data.error;
  if (err && typeof err === "object" && typeof (err as { message?: string }).message === "string") {
    errorMessage = (err as { message: string }).message.trim() || undefined;
  }
  return { isValid, type, profileId, scopes, errorMessage };
}

async function fetchDebugTokenPayload(inputToken: string): Promise<
  | { ok: false; error: string }
  | { ok: true; payload: Record<string, unknown> }
> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return { ok: false, error: "META_APP_ID e META_APP_SECRET em falta." };
  }

  const url = new URL(`${META_GRAPH_ORIGIN}/debug_token`);
  url.searchParams.set("input_token", inputToken);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const body = await res.text();
  if (!res.ok) {
    return { ok: false, error: `debug_token HTTP ${res.status}: ${body.slice(0, 240)}` };
  }
  let json: { data?: Record<string, unknown> };
  try {
    json = JSON.parse(body) as { data?: Record<string, unknown> };
  } catch {
    return { ok: false, error: "Resposta inválida do debug_token." };
  }

  const data = json.data;
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Resposta inválida do debug_token." };
  }
  return { ok: true, payload: data as Record<string, unknown> };
}

/**
 * Validates a Page access token pasted by the user (e.g. from Graph API Explorer).
 * Requires app credentials. Ensures debug_token type is PAGE and profile_id matches the selected page.
 */
export async function validatePastedPageAccessToken(
  pageAccessToken: string,
  expectedPageId: string
): Promise<
  | { ok: false; error: string; code: string }
  | { ok: true; scopes: string[]; missingBaseScopes: string[] }
> {
  const fetched = await fetchDebugTokenPayload(pageAccessToken);
  if (!fetched.ok) {
    if (fetched.error === "META_APP_ID e META_APP_SECRET em falta.") {
      return {
        ok: false,
        code: "DEBUG_TOKEN_CONFIG",
        error:
          "Para usar um token colado, configure META_APP_ID e META_APP_SECRET no servidor (necessário para validar o token na Meta).",
      };
    }
    return { ok: false, code: "DEBUG_TOKEN_INVALID", error: fetched.error };
  }

  const parsed = parseDebugTokenPayload(fetched.payload);
  if (!parsed.isValid) {
    return {
      ok: false,
      code: "INVALID_TOKEN",
      error: parsed.errorMessage ?? "Token inválido segundo debug_token.",
    };
  }

  const expectId = expectedPageId.trim();
  const typeNorm = parsed.type?.toUpperCase();
  if (typeNorm !== "PAGE") {
    return {
      ok: false,
      code: "NOT_PAGE_TOKEN",
      error:
        'O token colado não é um Page access token (tipo "PAGE"). No Explorador da Graph API, em "User or Page" escolha a Página e gere/copie o token para essa Página.',
    };
  }
  if (!parsed.profileId || parsed.profileId !== expectId) {
    return {
      ok: false,
      code: "PAGE_TOKEN_PROFILE_MISMATCH",
      error:
        "Este token não corresponde à página selecionada (o token tem de ser da mesma Página). Verifique o pageId e o token copiado.",
    };
  }

  const missingBaseScopes = REQUIRED_PAGE_TOKEN_SCOPES_FOR_ENGAGEMENT_POSTS.filter((s) => !parsed.scopes.includes(s));
  return { ok: true, scopes: parsed.scopes, missingBaseScopes };
}

export async function inspectTokenScopes(
  inputToken: string,
  options?: InspectTokenScopesOptions
): Promise<InspectTokenResult> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    // Can't verify scopes without app credentials — skip gracefully
    return { valid: true, scopes: [], missingScopes: [] };
  }

  const fetched = await fetchDebugTokenPayload(inputToken);
  if (!fetched.ok) {
    return { valid: false, error: fetched.error };
  }

  const parsed = parseDebugTokenPayload(fetched.payload);
  if (!parsed.isValid) {
    const msg = parsed.errorMessage ?? "Token inválido segundo debug_token.";
    return { valid: false, error: msg };
  }

  const scopes = parsed.scopes;
  const required = options?.requiredScopes ?? REQUIRED_TOKEN_SCOPES;
  const missingScopes = required.filter((s) => !scopes.includes(s));
  return { valid: true, scopes, missingScopes };
}
