import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  shouldSendAlert,
  resetThrottle,
  resetAllThrottles,
  getThrottleStatus,
  getTimeUntilNextAlert,
} from "@/lib/observability/alert-throttle"

describe("Alert Throttling", () => {
  beforeEach(() => {
    // Reset all throttles before each test
    resetAllThrottles()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("shouldSendAlert", () => {
    it("allows first alert immediately", () => {
      const result = shouldSendAlert("circuit-open")
      expect(result).toBe(true)
    })

    it("blocks second alert within throttle window", () => {
      shouldSendAlert("circuit-open") // First alert

      const result = shouldSendAlert("circuit-open") // Second alert (blocked)
      expect(result).toBe(false)
    })

    it("allows alert after throttle window expires (circuit-open: 10min)", () => {
      shouldSendAlert("circuit-open") // First alert

      // Advance time by 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000)

      const result = shouldSendAlert("circuit-open") // Should be allowed
      expect(result).toBe(true)
    })

    it("allows alert after throttle window expires (high-error-rate: 5min)", () => {
      shouldSendAlert("high-error-rate") // First alert

      // Advance time by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)

      const result = shouldSendAlert("high-error-rate") // Should be allowed
      expect(result).toBe(true)
    })

    it("allows alert after throttle window expires (circuit-closed: 1hour)", () => {
      shouldSendAlert("circuit-closed") // First alert

      // Advance time by 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000)

      const result = shouldSendAlert("circuit-closed") // Should be allowed
      expect(result).toBe(true)
    })

    it("blocks alert just before window expires", () => {
      shouldSendAlert("circuit-open") // First alert

      // Advance time by 9 minutes 59 seconds (just before 10min)
      vi.advanceTimersByTime(9 * 60 * 1000 + 59 * 1000)

      const result = shouldSendAlert("circuit-open") // Should be blocked
      expect(result).toBe(false)
    })

    it("uses different windows for different alert types", () => {
      shouldSendAlert("circuit-open") // 10min window
      shouldSendAlert("high-error-rate") // 5min window

      // Advance 6 minutes
      vi.advanceTimersByTime(6 * 60 * 1000)

      // circuit-open still throttled (10min window)
      expect(shouldSendAlert("circuit-open")).toBe(false)

      // high-error-rate allowed (5min window expired)
      expect(shouldSendAlert("high-error-rate")).toBe(true)
    })

    it("tracks alerts independently per type", () => {
      // Send circuit-open alert
      shouldSendAlert("circuit-open")

      // circuit-closed should still be allowed (different type)
      expect(shouldSendAlert("circuit-closed")).toBe(true)

      // circuit-open should be throttled
      expect(shouldSendAlert("circuit-open")).toBe(false)
    })

    it("tracks total alert count", () => {
      shouldSendAlert("circuit-open") // 1st

      vi.advanceTimersByTime(11 * 60 * 1000)
      shouldSendAlert("circuit-open") // 2nd

      vi.advanceTimersByTime(11 * 60 * 1000)
      shouldSendAlert("circuit-open") // 3rd

      const status = getThrottleStatus()
      expect(status["circuit-open"]?.count).toBe(3)
    })

    it("allows multiple alerts after window resets", () => {
      shouldSendAlert("circuit-open") // 1st alert

      // First retry - blocked
      expect(shouldSendAlert("circuit-open")).toBe(false)

      // Wait 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000)

      // Second alert - allowed
      expect(shouldSendAlert("circuit-open")).toBe(true)

      // Third attempt - blocked again
      expect(shouldSendAlert("circuit-open")).toBe(false)

      // Wait another 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000)

      // Fourth alert - allowed
      expect(shouldSendAlert("circuit-open")).toBe(true)
    })
  })

  describe("resetThrottle", () => {
    it("resets throttle for specific alert type", () => {
      shouldSendAlert("circuit-open") // First alert

      // Should be throttled
      expect(shouldSendAlert("circuit-open")).toBe(false)

      // Reset throttle
      resetThrottle("circuit-open")

      // Should now be allowed
      expect(shouldSendAlert("circuit-open")).toBe(true)
    })

    it("only resets specified type", () => {
      shouldSendAlert("circuit-open")
      shouldSendAlert("circuit-closed")

      resetThrottle("circuit-open")

      // circuit-open should be reset
      expect(shouldSendAlert("circuit-open")).toBe(true)

      // circuit-closed should still be throttled
      expect(shouldSendAlert("circuit-closed")).toBe(false)
    })
  })

  describe("resetAllThrottles", () => {
    it("resets all throttle types", () => {
      shouldSendAlert("circuit-open")
      shouldSendAlert("circuit-closed")
      shouldSendAlert("high-error-rate")

      resetAllThrottles()

      expect(shouldSendAlert("circuit-open")).toBe(true)
      expect(shouldSendAlert("circuit-closed")).toBe(true)
      expect(shouldSendAlert("high-error-rate")).toBe(true)
    })
  })

  describe("getThrottleStatus", () => {
    it("returns null for uninitialized throttles", () => {
      const status = getThrottleStatus()

      expect(status["circuit-open"]).toBeNull()
      expect(status["circuit-closed"]).toBeNull()
      expect(status["high-error-rate"]).toBeNull()
    })

    it("returns throttle data after alerts sent", () => {
      shouldSendAlert("circuit-open")

      const status = getThrottleStatus()

      expect(status["circuit-open"]).not.toBeNull()
      expect(status["circuit-open"]?.count).toBe(1)
      expect(status["circuit-open"]?.lastSent).toBeGreaterThan(0)
    })

    it("tracks multiple alert types separately", () => {
      shouldSendAlert("circuit-open")
      vi.advanceTimersByTime(1000) // Small delay
      shouldSendAlert("high-error-rate")

      const status = getThrottleStatus()

      expect(status["circuit-open"]).not.toBeNull()
      expect(status["high-error-rate"]).not.toBeNull()
      expect(status["circuit-closed"]).toBeNull()
    })
  })

  describe("getTimeUntilNextAlert", () => {
    it("returns 0 if no throttle exists", () => {
      const time = getTimeUntilNextAlert("circuit-open")
      expect(time).toBe(0)
    })

    it("returns 0 if window has expired", () => {
      shouldSendAlert("circuit-open")

      vi.advanceTimersByTime(11 * 60 * 1000) // 11 minutes

      const time = getTimeUntilNextAlert("circuit-open")
      expect(time).toBe(0)
    })

    it("returns remaining time if window active", () => {
      shouldSendAlert("circuit-open") // 10min window

      vi.advanceTimersByTime(3 * 60 * 1000) // 3 minutes passed

      const time = getTimeUntilNextAlert("circuit-open")
      expect(time).toBe(7 * 60 * 1000) // 7 minutes remaining
    })

    it("calculates time correctly for different alert types", () => {
      shouldSendAlert("high-error-rate") // 5min window

      vi.advanceTimersByTime(2 * 60 * 1000) // 2 minutes passed

      const time = getTimeUntilNextAlert("high-error-rate")
      expect(time).toBe(3 * 60 * 1000) // 3 minutes remaining
    })
  })

  describe("edge cases", () => {
    it("handles rapid successive calls correctly", () => {
      expect(shouldSendAlert("circuit-open")).toBe(true)
      expect(shouldSendAlert("circuit-open")).toBe(false)
      expect(shouldSendAlert("circuit-open")).toBe(false)
      expect(shouldSendAlert("circuit-open")).toBe(false)

      const status = getThrottleStatus()
      expect(status["circuit-open"]?.count).toBe(1) // Only first was sent
    })

    it("handles window expiry at exact boundary", () => {
      shouldSendAlert("circuit-open")

      // Advance exactly 10 minutes (boundary)
      vi.advanceTimersByTime(10 * 60 * 1000)

      expect(shouldSendAlert("circuit-open")).toBe(true)
    })

    it("maintains separate counts across window resets", () => {
      shouldSendAlert("circuit-open") // Count: 1

      vi.advanceTimersByTime(11 * 60 * 1000)
      shouldSendAlert("circuit-open") // Count: 2

      vi.advanceTimersByTime(11 * 60 * 1000)
      shouldSendAlert("circuit-open") // Count: 3

      const status = getThrottleStatus()
      expect(status["circuit-open"]?.count).toBe(3)
    })
  })
})
