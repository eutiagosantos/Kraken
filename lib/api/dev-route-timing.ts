/**
 * Logs API route duration in development (hot-path triage).
 * No-op in production.
 */
export function devLogRouteMs(routeLabel: string, startedAtMs: number): void {
  if (process.env.NODE_ENV !== "development") return;
  const ms = Date.now() - startedAtMs;
  console.debug(`[kraken:api] ${routeLabel} ${ms}ms`);
}
