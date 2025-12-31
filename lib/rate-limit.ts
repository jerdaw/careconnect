/**
 * Simple in-memory rate limiter for serverless environments.
 *
 * Note: This is a best-effort limiter for serverless. For strict rate limiting,
 * consider Vercel Edge Config, Upstash Redis, or similar persistent stores.
 *
 * This implementation uses request IP and a sliding window approach.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (resets on cold start)
const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number // Unix timestamp
}

/**
 * Check if a request is within rate limits.
 *
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param limit - Max requests allowed in window
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60 * 1000 // 1 minute default
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    const entries = Array.from(rateLimitStore.entries())
    for (const [key, val] of entries) {
      if (val.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  }

  // Check existing entry
  if (entry && entry.resetAt > now) {
    // Within window
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        reset: Math.ceil(entry.resetAt / 1000),
      }
    }

    entry.count++
    return {
      success: true,
      remaining: limit - entry.count,
      reset: Math.ceil(entry.resetAt / 1000),
    }
  }

  // New window
  const resetAt = now + windowMs
  rateLimitStore.set(identifier, { count: 1, resetAt })

  return {
    success: true,
    remaining: limit - 1,
    reset: Math.ceil(resetAt / 1000),
  }
}

/**
 * Get client IP from request headers (works with Vercel/Cloudflare).
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

  return "unknown"
}
