import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Upstash Redis client — falls back gracefully if env vars aren't set (dev without Redis)
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return redis
}

// Cache of ratelimiters keyed by "limit:window" string
const limiters = new Map<string, Ratelimit>()

function getRatelimiter(limit: number, windowSeconds: number): Ratelimit | null {
  const r = getRedis()
  if (!r) return null

  const key = `${limit}:${windowSeconds}`
  if (!limiters.has(key)) {
    limiters.set(key, new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds}s`),
      analytics: true,
      prefix: 'afriflix_rl',
    }))
  }
  return limiters.get(key)!
}

// In-memory fallback for local dev (single instance only)
const memStore = new Map<string, { count: number; reset: number }>()

function memRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = memStore.get(identifier)
  if (!entry || now > entry.reset) {
    memStore.set(identifier, { count: 1, reset: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

/**
 * checkRateLimit — works with Upstash Redis in production, falls back to
 * in-memory store in dev if UPSTASH_REDIS_REST_URL is not set.
 *
 * @param identifier  Key to rate-limit on (userId, IP, etc.)
 * @param limit       Max requests allowed
 * @param windowMs    Window in milliseconds
 * @returns           true = allowed, false = blocked
 */
export async function checkRateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60_000
): Promise<boolean> {
  const limiter = getRatelimiter(limit, Math.ceil(windowMs / 1000))
  if (!limiter) {
    return memRateLimit(identifier, limit, windowMs)
  }

  const { success } = await limiter.limit(identifier)
  return success
}

export { getRedis }
