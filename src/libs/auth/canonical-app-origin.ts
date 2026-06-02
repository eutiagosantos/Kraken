/** Production URL; used when env overrides are unset. */
export const CANONICAL_APP_ORIGIN = "https://kraken-sigma-three.vercel.app";

const VERCEL_TOOLBAR_QUERY = "__vercel_toolbar_code";

function parseHttpsOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Canonical app origin for auth redirects and preview → production middleware. */
export function getCanonicalAppOrigin(): string {
  const fromPublic = parseHttpsOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (fromPublic) return fromPublic;

  const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prodHost) {
    const hostOnly = prodHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const fromVercel = parseHttpsOrigin(`https://${hostOnly}`);
    if (fromVercel) return fromVercel;
  }

  return CANONICAL_APP_ORIGIN;
}

export function getCanonicalAppHost(): string {
  return new URL(getCanonicalAppOrigin()).host;
}

/** True on Vercel preview deployments when the request host is not the canonical host. */
export function isPreviewDeploymentHost(host: string): boolean {
  if (process.env.VERCEL_ENV !== "preview") return false;
  return host !== getCanonicalAppHost();
}

/** Builds absolute redirect URL on canonical origin; strips Vercel preview toolbar query. */
export function buildCanonicalRedirectUrl(requestUrl: URL): string {
  const target = new URL(requestUrl.pathname, getCanonicalAppOrigin());
  requestUrl.searchParams.forEach((value, key) => {
    if (key === VERCEL_TOOLBAR_QUERY) return;
    target.searchParams.set(key, value);
  });
  const search = target.searchParams.toString();
  return search ? `${target.origin}${target.pathname}?${search}` : `${target.origin}${target.pathname}`;
}

export function buildCanonicalAppUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getCanonicalAppOrigin()}${normalized}`;
}
