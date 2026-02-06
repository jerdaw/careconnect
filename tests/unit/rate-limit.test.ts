import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("In-Memory Rate Limiting", () => {
    it("allows requests under the limit", async () => {
      const identifier = "test-user-1"
      const limit = 5
      const windowMs = 10000

      for (let i = 0; i < limit; i++) {
        const result = await checkRateLimit(identifier, limit, windowMs)
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(limit - i - 1)
      }
    })

    it("blocks requests over the limit", async () => {
      const identifier = "test-user-2"
      const limit = 3
      const windowMs = 10000

      // Use up the limit
      for (let i = 0; i < limit; i++) {
        await checkRateLimit(identifier, limit, windowMs)
      }

      // Next request should be blocked
      const result = await checkRateLimit(identifier, limit, windowMs)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("resets the window after timeout", async () => {
      const identifier = "test-user-3"
      const limit = 2
      const windowMs = 5000

      // Use up the limit
      await checkRateLimit(identifier, limit, windowMs)
      await checkRateLimit(identifier, limit, windowMs)

      // Next request should be blocked
      let result = await checkRateLimit(identifier, limit, windowMs)
      expect(result.success).toBe(false)

      // Advance time past the window
      vi.advanceTimersByTime(windowMs + 1000)

      // Should allow requests again
      result = await checkRateLimit(identifier, limit, windowMs)
      expect(result.success).toBe(true)
    })

    it("tracks different identifiers independently", async () => {
      const limit = 2
      const windowMs = 10000

      // User 1 uses up their limit
      await checkRateLimit("user-1", limit, windowMs)
      await checkRateLimit("user-1", limit, windowMs)
      const result1 = await checkRateLimit("user-1", limit, windowMs)
      expect(result1.success).toBe(false)

      // User 2 should still have their full limit
      const result2 = await checkRateLimit("user-2", limit, windowMs)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(limit - 1)
    })

    it("returns correct reset timestamp", async () => {
      const identifier = "test-user-4"
      const limit = 5
      const windowMs = 10000
      const now = Date.now()

      vi.setSystemTime(now)

      const result = await checkRateLimit(identifier, limit, windowMs)
      expect(result.success).toBe(true)

      // Reset should be approximately windowMs in the future (in seconds)
      const expectedReset = Math.ceil((now + windowMs) / 1000)
      expect(result.reset).toBeGreaterThanOrEqual(expectedReset - 1)
      expect(result.reset).toBeLessThanOrEqual(expectedReset + 1)
    })

    it("uses default limit and window when not specified", async () => {
      const identifier = "test-user-5"

      const result = await checkRateLimit(identifier)
      expect(result.success).toBe(true)
      expect(result).toHaveProperty("remaining")
      expect(result).toHaveProperty("reset")
    })
  })

  describe("getClientIp", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      })

      const ip = getClientIp(request)
      expect(ip).toBe("192.168.1.1")
    })

    it("extracts IP from x-real-ip header when x-forwarded-for is missing", () => {
      const request = new Request("http://localhost", {
        headers: { "x-real-ip": "203.0.113.42" },
      })

      const ip = getClientIp(request)
      expect(ip).toBe("203.0.113.42")
    })

    it("returns localhost when no IP headers present", () => {
      const request = new Request("http://localhost")

      const ip = getClientIp(request)
      expect(ip).toBe("127.0.0.1")
    })

    it("trims whitespace from x-forwarded-for IP", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "  192.168.1.1  , 10.0.0.1" },
      })

      const ip = getClientIp(request)
      expect(ip).toBe("192.168.1.1")
    })

    it("prefers x-forwarded-for over x-real-ip when both present", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "10.0.0.1",
        },
      })

      const ip = getClientIp(request)
      expect(ip).toBe("192.168.1.1")
    })
  })
})
