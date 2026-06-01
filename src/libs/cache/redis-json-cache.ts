import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = null;
    return null;
  }
  redisClient = Redis.fromEnv();
  return redisClient;
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(key);
    if (raw == null || raw === "") return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function redisSetJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch {
    // best-effort
  }
}
