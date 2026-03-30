/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CircuitState } from "@/lib/resilience/circuit-breaker"
import { createCircuitBreakerTelemetry, CircuitBreakerEvent, logCircuitBreakerEvent } from "@/lib/resilience/telemetry"

const { mockLogger, mockAxiom, mockSlack } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  mockAxiom: {
    sendCircuitBreakerEvent: vi.fn().mockResolvedValue(undefined),
  },
  mockSlack: {
    sendCircuitBreakerAlert: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}))

vi.mock("@/lib/observability/axiom", () => mockAxiom)
vi.mock("@/lib/integrations/slack", () => mockSlack)

describe("Circuit breaker telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("logs opened events at error severity", () => {
    logCircuitBreakerEvent({
      circuitName: "supabase",
      event: CircuitBreakerEvent.CIRCUIT_OPENED,
      timestamp: Date.now(),
      state: CircuitState.OPEN,
      failureCount: 3,
    })

    expect(mockLogger.error).toHaveBeenCalledWith("Circuit breaker 'supabase' OPENED", {
      event: CircuitBreakerEvent.CIRCUIT_OPENED,
      timestamp: expect.any(Number),
      state: CircuitState.OPEN,
      failureCount: 3,
    })
  })

  it("fans out opened events to Axiom and Slack in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const telemetry = createCircuitBreakerTelemetry("supabase")

    telemetry.reportOpened(5, 0.8)
    await new Promise((resolve) => setTimeout(resolve, 0))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockAxiom.sendCircuitBreakerEvent).toHaveBeenCalledWith({
      state: CircuitState.OPEN,
      previousState: CircuitState.CLOSED,
      failureCount: 5,
      successCount: 0,
      failureRate: 0.8,
    })
    expect(mockSlack.sendCircuitBreakerAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        state: CircuitState.OPEN,
        previousState: CircuitState.CLOSED,
        failureCount: 5,
        failureRate: 0.8,
      })
    )
  })

  it("does not fan out events outside production", async () => {
    vi.stubEnv("NODE_ENV", "development")
    const telemetry = createCircuitBreakerTelemetry("supabase")

    telemetry.reportClosed()
    await Promise.resolve()

    expect(mockAxiom.sendCircuitBreakerEvent).not.toHaveBeenCalled()
    expect(mockSlack.sendCircuitBreakerAlert).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith("Circuit breaker 'supabase' CLOSED", {
      event: CircuitBreakerEvent.CIRCUIT_CLOSED,
      timestamp: expect.any(Number),
      state: CircuitState.CLOSED,
    })
  })
})
