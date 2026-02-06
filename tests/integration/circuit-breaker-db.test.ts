import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CircuitState } from "@/lib/resilience/circuit-breaker"
import { withCircuitBreaker, resetSupabaseBreaker, getSupabaseBreakerStats } from "@/lib/resilience/supabase-breaker"
import { DatabaseSimulator } from "./utils/db-simulator"
import { trackEvent } from "@/lib/analytics"
import { getServiceById } from "@/lib/services"
import { syncOfflineData } from "@/lib/offline/sync"
import { logger } from "@/lib/logger"

// Mock logger to avoid noise
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Set environment variables for circuit breaker configuration
process.env.CIRCUIT_BREAKER_ENABLED = "true"
process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD = "3"
process.env.CIRCUIT_BREAKER_TIMEOUT = "100" // Short timeout for testing (100ms)

describe("Circuit Breaker Integration", () => {
  const dbSimulator = new DatabaseSimulator()

  // Mock operation that fails based on simulator
  const mockDbOperation = async () => {
    if (dbSimulator.shouldFailThisCall()) {
      throw new Error("Database connection failed")
    }
    return { data: "success", error: null }
  }

  beforeEach(() => {
    // Force recreation of circuit breaker with test configuration
    // We need to do this before resetSupabaseBreaker() to ensure the breaker exists
    getSupabaseBreakerStats() // This will create the breaker if it doesn't exist
    resetSupabaseBreaker()
    dbSimulator.restore()
    // Use fake timers with Date mocking enabled
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should open circuit after threshold failures", async () => {
    // defaults: failureThreshold=3
    dbSimulator.simulateFailure(3)

    // 1st failure
    await expect(withCircuitBreaker(mockDbOperation)).rejects.toThrow("Database connection failed")
    expect(getSupabaseBreakerStats().state).toBe(CircuitState.CLOSED)

    // 2nd failure
    await expect(withCircuitBreaker(mockDbOperation)).rejects.toThrow("Database connection failed")
    expect(getSupabaseBreakerStats().state).toBe(CircuitState.CLOSED)

    // 3rd failure - should OPEN
    await expect(withCircuitBreaker(mockDbOperation)).rejects.toThrow("Database connection failed")
    expect(getSupabaseBreakerStats().state).toBe(CircuitState.OPEN)

    // Next request should fail immediately with CircuitOpenError
    // We expect the wrapper to throw the original CircuitOpenError or handle it?
    // The wrapper throws CircuitOpenError internaly if no fallback is provided.
    // However, our route handler catches it. Here we test the library function directly.
    await expect(withCircuitBreaker(mockDbOperation)).rejects.toThrow(/Circuit breaker 'supabase' is OPEN/)
  })

  it("should recover automatically after timeout (HALF_OPEN)", async () => {
    // Open the circuit
    dbSimulator.simulateFailure(3)
    for (let i = 0; i < 3; i++) {
      try {
        await withCircuitBreaker(mockDbOperation)
      } catch {}
    }
    expect(getSupabaseBreakerStats().state).toBe(CircuitState.OPEN)

    // Fast forward past timeout (100ms) - advance both timers and system time
    const currentTime = new Date("2024-01-01T00:00:00Z").getTime()
    vi.setSystemTime(currentTime + 150)
    vi.advanceTimersByTime(150)

    // Database is back up
    dbSimulator.restore()

    // Next request should be allowed (HALF_OPEN) and succeed
    const result = await withCircuitBreaker(mockDbOperation)
    expect(result.data).toBe("success")

    // Circuit should be CLOSED after success
    expect(getSupabaseBreakerStats().state).toBe(CircuitState.CLOSED)
  })

  it("should use fallback when circuit is open", async () => {
    // Open the circuit
    dbSimulator.simulateFailure(3)
    for (let i = 0; i < 3; i++) {
      try {
        await withCircuitBreaker(mockDbOperation)
      } catch {}
    }

    // Define fallback
    const fallbackFn = async () => ({ data: "fallback", error: null })

    // Call with fallback
    const result = await withCircuitBreaker(mockDbOperation, fallbackFn)

    expect(result.data).toBe("fallback")
  })

  it("should remain open if recovery fails", async () => {
    // Open the circuit
    dbSimulator.simulateFailure(10) // Fails for a long time
    for (let i = 0; i < 3; i++) {
      try {
        await withCircuitBreaker(mockDbOperation)
      } catch {}
    }
    expect(getSupabaseBreakerStats().state).toBe(CircuitState.OPEN)

    // Fast forward past timeout - advance both timers and system time
    const currentTime = new Date("2024-01-01T00:00:00Z").getTime()
    vi.setSystemTime(currentTime + 150)
    vi.advanceTimersByTime(150)

    // Next request attempts HALF_OPEN but fails
    await expect(withCircuitBreaker(mockDbOperation)).rejects.toThrow("Database connection failed")

    // Should go back to OPEN immediately
    expect(getSupabaseBreakerStats().state).toBe(CircuitState.OPEN)
  })

  it("should reset failure count after successful request", async () => {
    dbSimulator.simulateFailure(2) // Less than threshold 3

    // 2 failures
    try {
      await withCircuitBreaker(mockDbOperation)
    } catch {}
    try {
      await withCircuitBreaker(mockDbOperation)
    } catch {}

    expect(getSupabaseBreakerStats().failureCount).toBe(2)

    // Success
    await withCircuitBreaker(mockDbOperation)

    // Count should reset
    expect(getSupabaseBreakerStats().failureCount).toBe(0)
  })

  it("should skip analytics when circuit is open (Graceful Degradation)", async () => {
    // Open the circuit
    dbSimulator.simulateFailure(3)
    for (let i = 0; i < 3; i++) {
      try {
        await withCircuitBreaker(mockDbOperation)
      } catch {}
    }
    expect(getSupabaseBreakerStats().state).toBe(CircuitState.OPEN)

    // Analytics call should not throw
    await expect(trackEvent("service-1", "view_detail")).resolves.not.toThrow()

    // Verify logger warning was called for analytics skip
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Analytics skipped: Circuit breaker open"),
      expect.any(Object)
    )
  })

  it("should return null for service lookups when circuit is open", async () => {
    // Open the circuit
    dbSimulator.simulateFailure(3)
    for (let i = 0; i < 3; i++) {
      try {
        await withCircuitBreaker(mockDbOperation)
      } catch {}
    }

    // Service lookup should return null gracefully
    const service = await getServiceById("service-1")
    expect(service).toBeNull()
  })

  it("should skip offline sync when circuit is open", async () => {
    // Mock window to avoid "Server-side sync not supported" error
    vi.stubGlobal("window", {})

    // Open the circuit
    dbSimulator.simulateFailure(3)
    for (let i = 0; i < 3; i++) {
      try {
        await withCircuitBreaker(mockDbOperation)
      } catch {}
    }

    // Sync should return error status immediately
    const result = await syncOfflineData()
    expect(result.status).toBe("error")
    expect(result.error).toContain("Circuit breaker open")

    vi.unstubAllGlobals()
  })

  it("should log all state transitions", async () => {
    // Reset call counts
    vi.mocked(logger.info).mockClear()

    // 1. CLOSED -> OPEN
    dbSimulator.simulateFailure(3)
    for (let i = 0; i < 3; i++) {
      try {
        await withCircuitBreaker(mockDbOperation)
      } catch {}
    }

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("state transition"),
      expect.objectContaining({ from: CircuitState.CLOSED, to: CircuitState.OPEN })
    )

    // 2. OPEN -> HALF_OPEN - advance both timers and system time
    const currentTime = new Date("2024-01-01T00:00:00Z").getTime()
    vi.setSystemTime(currentTime + 150)
    vi.advanceTimersByTime(150)
    dbSimulator.restore()
    await withCircuitBreaker(mockDbOperation)

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("state transition"),
      expect.objectContaining({ from: CircuitState.OPEN, to: CircuitState.HALF_OPEN })
    )

    // 3. HALF_OPEN -> CLOSED
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("state transition"),
      expect.objectContaining({ from: CircuitState.HALF_OPEN, to: CircuitState.CLOSED })
    )
  })
})
