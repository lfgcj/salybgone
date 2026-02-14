import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

/**
 * Returns a Redis client for KV storage (subscribers, tokens, rate limits).
 * In production on Vercel, set KV_REST_API_URL and KV_REST_API_TOKEN
 * (auto-populated when you link a Vercel KV store).
 * Returns null when not configured — callers fall back to file-based storage.
 */
export function getKV(): Redis | null {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  if (!redis) {
    redis = new Redis({ url, token });
  }

  return redis;
}
