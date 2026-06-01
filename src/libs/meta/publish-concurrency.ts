/**
 * Run async work over `items` with at most `concurrency` tasks in flight.
 * Preserves result order matching `items`.
 */
export async function runWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.floor(concurrency));
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    for (;;) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= items.length) return;
      results[i] = await worker(items[i]!, i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runWorker());
  await Promise.all(workers);
  return results;
}

/** Default parallel Graph calls for large structures (override via META_PUBLISH_CONCURRENCY). */
export function metaPublishConcurrency(): number {
  const raw = process.env.META_PUBLISH_CONCURRENCY?.trim();
  if (!raw) return 5;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 5;
  return Math.min(20, n);
}

/** Structures at or above this ad-set count use deferred HTTP publish (202 + background). */
export function wizardPublishDeferredMinAdsets(): number {
  const raw = process.env.WIZARD_PUBLISH_DEFERRED_MIN_ADSETS?.trim();
  if (!raw) return 100;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 100;
  return n;
}

export function shouldDeferWizardPublish(adsetCount: number): boolean {
  if (process.env.WIZARD_PUBLISH_DEFERRED === "false") return false;
  if (process.env.WIZARD_PUBLISH_DEFERRED === "true") return true;
  return adsetCount >= wizardPublishDeferredMinAdsets();
}
