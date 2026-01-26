/**
 * Tests for Performance Tracking Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { trackPerformance, trackPerformanceSync, createPerformanceTimer, isPerformanceTrackingEnabled } from "@/lib/performance/tracker"
import { resetMetrics, getOperationMetrics } from "@/lib/performance/metrics"

describe("Performance Tracker", () => {
  beforeEach(() => {
    // Clear metrics before each test
    resetMetrics()
    // Force enable tracking for tests
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING", "true")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe("isPerformanceTrackingEnabled", () => {
    it("should return true when env var is set to 'true'", () => {
      vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING", "true")
      expect(isPerformanceTrackingEnabled()).toBe(true)
    })

    it("should return true in development mode", () => {
      vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING", "false")
      vi.stubEnv("NODE_ENV", "development")
      expect(isPerformanceTrackingEnabled()).toBe(true)
    })

    it("should return false when disabled in production", () => {
      vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING", "false")
      vi.stubEnv("NODE_ENV", "production")
      expect(isPerformanceTrackingEnabled()).toBe(false)
    })
  })

  describe("trackPerformance", () => {
    it("should track async operation performance", async () => {
      const operation = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return "result"
      })

      const result = await trackPerformance("test.operation", operation)

      expect(result).toBe("result")
      expect(operation).toHaveBeenCalledTimes(1)

      const metrics = getOperationMetrics("test.operation")
      expect(metrics).toBeTruthy()
      expect(metrics?.count).toBe(1)
      expect(metrics?.min).toBeGreaterThanOrEqual(0)
    })

    it("should track operation with metadata", async () => {
      const operation = vi.fn(async () => "result")
      const metadata = { userId: "123", action: "search" }

      await trackPerformance("test.withMetadata", operation, metadata)

      const metrics = getOperationMetrics("test.withMetadata")
      expect(metrics).toBeTruthy()
      expect(metrics?.count).toBe(1)
    })

    it("should rethrow errors from operation", async () => {
      const operation = vi.fn(async () => {
        throw new Error("Test error")
      })

      await expect(trackPerformance("test.error", operation)).rejects.toThrow("Test error")

      // Operation should have been called
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it("should not track when disabled", async () => {
      vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING", "false")
      vi.stubEnv("NODE_ENV", "production")

      const operation = vi.fn(async () => "result")
      const result = await trackPerformance("test.disabled", operation)

      expect(result).toBe("result")
      expect(operation).toHaveBeenCalledTimes(1)

      const metrics = getOperationMetrics("test.disabled")
      // Should not record metrics when disabled
      expect(metrics).toBeNull()
    })

    it("should have minimal overhead", async () => {
      const operation = vi.fn(async () => {
        // Simulate 100ms operation
        await new Promise((resolve) => setTimeout(resolve, 100))
        return "result"
      })

      const start = performance.now()
      await trackPerformance("test.overhead", operation)
      const end = performance.now()

      const totalDuration = end - start
      const metrics = getOperationMetrics("test.overhead")

      // Tracking overhead should be < 5ms
      const overhead = totalDuration - (metrics?.mean || 0)
      expect(overhead).toBeLessThan(5)
    })
  })

  describe("trackPerformanceSync", () => {
    it("should track sync operation performance", () => {
      const operation = vi.fn(() => {
        // Simulate work
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      })

      const result = trackPerformanceSync("test.sync", operation)

      expect(typeof result).toBe("number")
      expect(operation).toHaveBeenCalledTimes(1)

      const metrics = getOperationMetrics("test.sync")
      expect(metrics).toBeTruthy()
      expect(metrics?.count).toBe(1)
    })

    it("should track sync operation with metadata", () => {
      const operation = vi.fn(() => 42)
      const metadata = { type: "calculation" }

      trackPerformanceSync("test.syncMetadata", operation, metadata)

      const metrics = getOperationMetrics("test.syncMetadata")
      expect(metrics).toBeTruthy()
      expect(metrics?.count).toBe(1)
    })

    it("should rethrow errors from sync operation", () => {
      const operation = vi.fn(() => {
        throw new Error("Sync error")
      })

      expect(() => trackPerformanceSync("test.syncError", operation)).toThrow("Sync error")
    })
  })

  describe("createPerformanceTimer", () => {
    it("should create a manual timer", () => {
      const stopTimer = createPerformanceTimer("test.manual")

      // Simulate some work
      let _sum = 0
      for (let i = 0; i < 1000; i++) {
        _sum += i
      }

      stopTimer()

      const metrics = getOperationMetrics("test.manual")
      expect(metrics).toBeTruthy()
      expect(metrics?.count).toBe(1)
    })

    it("should work with metadata", () => {
      const metadata = { step: "processing" }
      const stopTimer = createPerformanceTimer("test.manualMeta", metadata)

      stopTimer()

      const metrics = getOperationMetrics("test.manualMeta")
      expect(metrics).toBeTruthy()
    })

    it("should be a no-op when tracking disabled", () => {
      vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING", "false")
      vi.stubEnv("NODE_ENV", "production")

      const stopTimer = createPerformanceTimer("test.manualDisabled")
      stopTimer()

      const metrics = getOperationMetrics("test.manualDisabled")
      expect(metrics).toBeNull()
    })
  })

  describe("multiple operations", () => {
    it("should track multiple calls to same operation", async () => {
      const operation = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        return "result"
      })

      // Call 5 times
      for (let i = 0; i < 5; i++) {
        await trackPerformance("test.multiple", operation)
      }

      const metrics = getOperationMetrics("test.multiple")
      expect(metrics).toBeTruthy()
      expect(metrics?.count).toBe(5)
      expect(metrics?.min).toBeGreaterThanOrEqual(0)
      expect(metrics?.max).toBeGreaterThanOrEqual(metrics?.min || 0)
      expect(metrics?.mean).toBeGreaterThanOrEqual(0)
      expect(metrics?.p50).toBeGreaterThanOrEqual(0)
      expect(metrics?.p95).toBeGreaterThanOrEqual(0)
      expect(metrics?.p99).toBeGreaterThanOrEqual(0)
    })

    it("should track different operations independently", async () => {
      await trackPerformance("test.op1", async () => "result1")
      await trackPerformance("test.op2", async () => "result2")

      const metrics1 = getOperationMetrics("test.op1")
      const metrics2 = getOperationMetrics("test.op2")

      expect(metrics1).toBeTruthy()
      expect(metrics2).toBeTruthy()
      expect(metrics1?.operation).toBe("test.op1")
      expect(metrics2?.operation).toBe("test.op2")
    })
  })
})
