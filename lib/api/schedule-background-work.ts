/**
 * Continue work after the HTTP response (Vercel `waitUntil` when available).
 * @returns true if the response can return before `work` finishes (deferred).
 */
export async function scheduleBackgroundWork(work: () => Promise<void>): Promise<boolean> {
  try {
    const mod = await import("@vercel/functions");
    if (typeof mod.waitUntil === "function") {
      mod.waitUntil(work());
      return true;
    }
  } catch {
    /* @vercel/functions optional — inline fallback below */
  }
  await work();
  return false;
}
