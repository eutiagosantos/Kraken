type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const inMemoryCache = new Map<string, CacheEntry<unknown>>();

export function getFromCache<T>(key: string): T | null {
  const entry = inMemoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    inMemoryCache.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setInCache<T>(key: string, value: T, ttlMs: number) {
  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}
