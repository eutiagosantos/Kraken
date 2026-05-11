const AUTH_CALLBACK_PATH = "/api/auth/callback";

/**
 * `redirect_to` passed to `signInWithOAuth` — where Supabase sends the browser after the exchange
 * (must be allow-listed in Supabase → Authentication → URL Configuration).
 */
export function buildOAuthReturnRedirectTo(origin: string, nextPath: string): string {
  const base = origin.replace(/\/+$/, "");
  const next =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/home";
  return `${base}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(next)}`;
}

/**
 * Register this exact URL in Meta → Facebook Login → Valid OAuth Redirect URIs.
 * Facebook calls Supabase here; it is not your Next.js `/api/auth/callback` URL.
 */
export function metaValidOAuthRedirectUriForSupabaseProject(supabaseProjectUrl: string): string {
  const base = supabaseProjectUrl.replace(/\/+$/, "");
  return `${base}/auth/v1/callback`;
}
