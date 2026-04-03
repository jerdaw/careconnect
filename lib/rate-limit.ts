/**
 * Dual-mode rate limiter using Upstash Redis with in-memory fallback.
 *
 * Strategy:
 * 1. Try to initialize Upstash Redis if env vars are present.
 * 2. If Redis is available, use @upstash/ratelimit for distributed state.
 * 3. Fallback to robust in-memory LRU-like map if Redis is missing or fails.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { logger } from "@/lib/logger"

// --- In-Memory Fallback Implementation ---

interface InMemoryEntry {
  count: number
  resetAt: number // Unix timestamp ms
}

class InMemoryStore {
  private store = new Map<string, InMemoryEntry>()
  private lastCleanup = Date.now()
  private cleanupInterval = 60 * 1000 // 1 minute

  public check(
    identifier: string,
    limit: number,
    windowMs: number
  ): { success: boolean; remaining: number; reset: number } {
    const now = Date.now()
    this.cleanup(now)

    let entry = this.store.get(identifier)

    // Create new window if expired or missing
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      this.store.set(identifier, entry)
    }

    const authorized = entry.count < limit
    const remaining = Math.max(0, limit - entry.count - 1)

    if (authorized) {
      entry.count++
    }

    return {
      success: authorized,
      remaining,
      reset: Math.ceil(entry.resetAt / 1000),
    }
  }

  private cleanup(now: number) {
    if (now - this.lastCleanup < this.cleanupInterval) return

    // Simple sweep
    for (const [key, val] of this.store.entries()) {
      if (val.resetAt <= now) {
        this.store.delete(key)
      }
    }

    this.lastCleanup = now

    // Safety cap
    if (this.store.size > 50000) {
      this.store.clear()
      logger.warn("Rate limit store cleared due to size safety cap", { component: "rate-limit" })
    }
  }
}

const memoryStore = new InMemoryStore()

// --- Upstash Implementation ---

let upstashRedis: Redis | null = null
const ratelimitCache = new Map<string, Ratelimit>()

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
} catch (err) {
  logger.warn("Failed to initialize Upstash", { error: err, component: "rate-limit" })
}

function getUpstashRateLimit(limit: number, windowMs: number): Ratelimit | null {
  if (!upstashRedis) {
    return null
  }

  const cacheKey = `${limit}:${windowMs}`
  const cached = ratelimitCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const limiter = new Ratelimit({
    redis: upstashRedis,
    limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
    analytics: true,
    prefix: "careconnect-ratelimit",
  })

  ratelimitCache.set(cacheKey, limiter)
  return limiter
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number // Unix timestamp seconds
}

/**
 * Build standard rate-limit response headers for blocked requests.
 */
export function createRateLimitHeaders(result: Pick<RateLimitResult, "reset">): HeadersInit {
  return {
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": result.reset.toString(),
    "Retry-After": Math.max(0, Math.ceil(result.reset - Date.now() / 1000)).toString(),
  }
}

/**
 * Check rate limit for a given identifier.
 *
 * @param identifier Unique key (IP or user ID)
 * @param limit Max requests
 * @param windowMs Window size in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60 * 1000,
  bucket: string = "global"
): Promise<RateLimitResult> {
  const scopedIdentifier = `${bucket}:${identifier}`

  // 1. Try Upstash
  const ratelimit = getUpstashRateLimit(limit, windowMs)
  if (ratelimit) {
    try {
      const { success, remaining, reset } = await ratelimit.limit(scopedIdentifier)

      return {
        success,
        remaining,
        reset: Math.floor(reset / 1000),
      }
    } catch (err) {
      logger.error("Upstash rate limit error, falling back to memory", { error: err, component: "rate-limit" })
      // Fallback to memory
    }
  }

  // 2. In-Memory Fallback
  return memoryStore.check(scopedIdentifier, limit, windowMs)
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]!.trim()
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  return "127.0.0.1"
}
