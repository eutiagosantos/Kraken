import { META_GRAPH_ORIGIN } from "@/lib/meta/constants";

export const REQUIRED_TOKEN_SCOPES = [
  "ads_management",
  "ads_read",
  "pages_show_list",
  "pages_manage_ads",
  "pages_read_engagement",
] as const;

/** Page access tokens from `/me/accounts` often omit ad-account scopes; use this for Graph calls that only need Page permissions. */
export const REQUIRED_PAGE_TOKEN_SCOPES_FOR_ENGAGEMENT_POSTS = [
  "pages_show_list",
  "pages_manage_ads",
  "pages_read_engagement",
] as const;

export type InspectTokenScopesOptions = {
  requiredScopes?: readonly string[];
};

export type InspectTokenResult =
  | { valid: false; error: string }
  | { valid: true; scopes: string[]; missingScopes: string[] };

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

  const url = new URL(`${META_GRAPH_ORIGIN}/debug_token`);
  url.searchParams.set("input_token", inputToken);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const body = await res.text();
  let json: { data?: { is_valid?: boolean; scopes?: string[]; error?: { message?: string } } };
  try {
    json = JSON.parse(body) as typeof json;
  } catch {
    return { valid: false, error: "Resposta inválida do debug_token." };
  }

  const data = json.data;
  if (!data?.is_valid) {
    const msg = data?.error?.message ?? "Token inválido segundo debug_token.";
    return { valid: false, error: msg };
  }

  const scopes = data.scopes ?? [];
  const required = options?.requiredScopes ?? REQUIRED_TOKEN_SCOPES;
  const missingScopes = required.filter((s) => !scopes.includes(s));
  return { valid: true, scopes, missingScopes };
}
