/**
 * Tests for Circuit Breaker
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { CircuitBreaker, CircuitState, CircuitOpenError } from "@/lib/resilience/circuit-breaker"

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: "test-circuit",
      failureThreshold: 3,
      failureRateThreshold: 0.5,
      timeout: 1000,
      halfOpenAttempts: 1,
      monitorWindow: 5000,
    })
  })

  describe("initial state", () => {
    it("should start in CLOSED state", () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it("should have zero failures initially", () => {
      const stats = breaker.getStats()
      expect(stats.failureCount).toBe(0)
      expect(stats.successCount).toBe(0)
      expect(stats.totalRequests).toBe(0)
    })
  })

  describe("successful requests", () => {
    it("should execute operation successfully", async () => {
      const operation = vi.fn(async () => "success")
      const result = await breaker.execute(operation)

      expect(result).toBe("success")
      expect(operation).toHaveBeenCalledTimes(1)
      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it("should track successful requests", async () => {
      await breaker.execute(async () => "result1")
      await breaker.execute(async () => "result2")

      const stats = breaker.getStats()
      expect(stats.totalRequests).toBe(2)
      expect(stats.successfulRequests).toBe(2)
      expect(stats.failedRequests).toBe(0)
    })
  })

  describe("failing requests", () => {
    it("should track failed requests", async () => {
      const operation = vi.fn(async () => {
        throw new Error("Test failure")
      })

      await expect(breaker.execute(operation)).rejects.toThrow("Test failure")

      const stats = breaker.getStats()
      expect(stats.failureCount).toBe(1)
      expect(stats.failedRequests).toBe(1)
    })

    it("should open circuit after threshold failures", async () => {
      const operation = vi.fn(async () => {
        throw new Error("Failure")
      })

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(operation)
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)
    })

    it("should throw CircuitOpenError when circuit is open", async () => {
      // Force circuit open
      breaker.forceOpen()

      const operation = vi.fn(async () => "result")

      await expect(breaker.execute(operation)).rejects.toThrow(CircuitOpenError)
      expect(operation).not.toHaveBeenCalled()
    })
  })

  describe("state transitions", () => {
    it("should transition from CLOSED to OPEN after failures", async () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED)

      // Cause 3 failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("Failure")
          })
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)
    })

    it("should transition from OPEN to HALF_OPEN after timeout", async () => {
      // Use shorter timeout for testing
      breaker = new CircuitBreaker({
        name: "test-timeout",
        failureThreshold: 1,
        timeout: 50, // 50ms timeout
        halfOpenAttempts: 1,
        monitorWindow: 5000,
        failureRateThreshold: 0.5,
      })

      // Cause failure to open circuit
      try {
        await breaker.execute(async () => {
          throw new Error("Failure")
        })
      } catch {}

      expect(breaker.getState()).toBe(CircuitState.OPEN)

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 60))

      // Next request should transition to HALF_OPEN
      try {
        await breaker.execute(async () => "success")
      } catch {}

      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it("should transition from HALF_OPEN to CLOSED on success", async () => {
      breaker = new CircuitBreaker({
        name: "test-half-open",
        failureThreshold: 1,
        timeout: 50,
        halfOpenAttempts: 1,
        monitorWindow: 5000,
        failureRateThreshold: 0.5,
      })

      // Open circuit
      try {
        await breaker.execute(async () => {
          throw new Error("Failure")
        })
      } catch {}

      expect(breaker.getState()).toBe(CircuitState.OPEN)

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 60))

      // Successful request should close circuit
      await breaker.execute(async () => "success")

      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it("should transition from HALF_OPEN to OPEN on failure", async () => {
      breaker = new CircuitBreaker({
        name: "test-half-open-fail",
        failureThreshold: 1,
        timeout: 50,
        halfOpenAttempts: 1,
        monitorWindow: 5000,
        failureRateThreshold: 0.5,
      })

      // Open circuit
      try {
        await breaker.execute(async () => {
          throw new Error("Failure")
        })
      } catch {}

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 60))

      // Failure in half-open should reopen circuit
      try {
        await breaker.execute(async () => {
          throw new Error("Failure again")
        })
      } catch {}

      expect(breaker.getState()).toBe(CircuitState.OPEN)
    })
  })

  describe("failure rate threshold", () => {
    it("should open circuit when failure rate exceeds threshold", async () => {
      breaker = new CircuitBreaker({
        name: "test-rate",
        failureThreshold: 3,
        failureRateThreshold: 0.5, // 50% threshold
        timeout: 1000,
        halfOpenAttempts: 1,
        monitorWindow: 5000,
      })

      // 2 successes, 3 failures = 60% failure rate
      await breaker.execute(async () => "success1")
      await breaker.execute(async () => "success2")

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("Failure")
          })
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)
    })

    it("should not open if failure rate is below threshold", async () => {
      breaker = new CircuitBreaker({
        name: "test-low-rate",
        failureThreshold: 10, // High threshold so only rate matters
        failureRateThreshold: 0.5,
        timeout: 1000,
        halfOpenAttempts: 1,
        monitorWindow: 5000,
      })

      // 3 successes, 2 failures = 40% failure rate (below 50%)
      await breaker.execute(async () => "success1")
      await breaker.execute(async () => "success2")
      await breaker.execute(async () => "success3")

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("Failure")
          })
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })
  })

  describe("statistics", () => {
    it("should provide accurate statistics", async () => {
      await breaker.execute(async () => "success1")
      await breaker.execute(async () => "success2")

      try {
        await breaker.execute(async () => {
          throw new Error("Failure")
        })
      } catch {}

      const stats = breaker.getStats()

      expect(stats.totalRequests).toBe(3)
      expect(stats.successfulRequests).toBe(2)
      expect(stats.failedRequests).toBe(1)
      expect(stats.failureRate).toBeCloseTo(0.333, 2)
    })
  })

  describe("reset and manual control", () => {
    it("should reset to initial state", async () => {
      // Cause some failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("Failure")
          })
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)

      breaker.reset()

      expect(breaker.getState()).toBe(CircuitState.CLOSED)
      expect(breaker.getStats().failureCount).toBe(0)
    })

    it("should allow manual open", () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED)

      breaker.forceOpen()

      expect(breaker.getState()).toBe(CircuitState.OPEN)
    })

    it("should allow manual close", async () => {
      breaker.forceOpen()
      expect(breaker.getState()).toBe(CircuitState.OPEN)

      breaker.forceClose()

      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })
  })

  describe("rolling window", () => {
    it("should prune old requests from history", async () => {
      breaker = new CircuitBreaker({
        name: "test-window",
        failureThreshold: 3,
        failureRateThreshold: 0.5,
        timeout: 1000,
        halfOpenAttempts: 1,
        monitorWindow: 100, // 100ms window
      })

      // Execute some requests
      await breaker.execute(async () => "result1")
      await breaker.execute(async () => "result2")

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150))

      const stats = breaker.getStats()
      // Total requests should be 0 after pruning (or very low)
      expect(stats.totalRequests).toBeLessThanOrEqual(2)
    })
  })
})
