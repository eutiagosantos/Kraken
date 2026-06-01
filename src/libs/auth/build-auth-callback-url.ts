/** Post-auth redirect for Supabase email links (signup confirm, magic link, etc.). */
export function buildAuthCallbackUrl(origin: string, next = "/home"): string {
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/home";
  return `${origin}/api/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
