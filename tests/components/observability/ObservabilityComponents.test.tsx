import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import enMessages from "@/messages/en.json"
import { CircuitBreakerCard } from "@/components/observability/CircuitBreakerCard"
import { HealthSummary } from "@/components/observability/HealthSummary"
import { PerformanceCharts } from "@/components/observability/PerformanceCharts"
import { SLOComplianceCard } from "@/components/observability/SLOComplianceCard"
import { SLODisclaimerBanner } from "@/components/observability/SLODisclaimerBanner"
import { AutoRefresh } from "@/components/observability/AutoRefresh"
import { CircuitState } from "@/lib/resilience/circuit-breaker"
import { act } from "react-dom/test-utils"
import { renderWithProviders, screen } from "@/tests/utils/test-wrapper"

const refreshMock = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}))

const metrics = {
  trackingSince: Date.now() - 60_000,
  totalOperations: 12,
  operations: {
    "search.total": {
      operation: "search.total",
      count: 8,
      min: 50,
      max: 400,
      mean: 120,
      p50: 90,
      p95: 220,
      p99: 380,
      recentSamples: 8,
    },
  },
}

describe("Observability component smoke coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    })
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders circuit breaker and health summary states", () => {
    renderWithProviders(
      <div>
        <CircuitBreakerCard
          stats={{
            state: CircuitState.OPEN,
            enabled: true,
            failureCount: 4,
            successCount: 2,
            totalRequests: 6,
            successfulRequests: 2,
            failedRequests: 4,
            failureRate: 0.66,
            nextAttemptTime: Date.now() + 60_000,
          }}
        />
        <HealthSummary
          circuitBreaker={{
            state: CircuitState.OPEN,
            enabled: true,
            failureCount: 4,
            successCount: 2,
            totalRequests: 6,
            successfulRequests: 2,
            failedRequests: 4,
            failureRate: 0.66,
            nextAttemptTime: null,
          }}
          metrics={metrics}
        />
      </div>,
      { messages: enMessages }
    )

    expect(screen.getByText("Circuit Breaker Status")).toBeInTheDocument()
    expect(screen.getByText("🚨 Circuit Open")).toBeInTheDocument()
    expect(screen.getByText("System Health")).toBeInTheDocument()
    expect(screen.getByText("⚠️ Degraded")).toBeInTheDocument()
  })

  it("renders performance and SLO cards in both empty and violation states", () => {
    const { rerender } = renderWithProviders(
      <div>
        <PerformanceCharts metrics={{ ...metrics, operations: {}, totalOperations: 0 }} />
        <SLOComplianceCard
          compliance={{
            uptime: { actual: 0.9, target: 0.995, compliant: false, totalChecks: 10, successfulChecks: 9 },
            errorBudget: { remaining: 0, consumed: 1, exhausted: true, warningThreshold: 0.5 },
            latency: { actualP95: 1200, target: 800, compliant: false, hasData: true },
            overall: { compliant: false, violations: ["Uptime below target", "Latency p95 exceeds target"] },
          }}
        />
        <SLODisclaimerBanner />
      </div>,
      { messages: enMessages }
    )

    expect(screen.getByText("No performance data available yet.")).toBeInTheDocument()
    expect(screen.getByText("SLO Compliance")).toBeInTheDocument()
    expect(screen.getByText("SLO Violation")).toBeInTheDocument()
    expect(screen.getByText(/Active SLO Violations:/)).toBeInTheDocument()
    expect(screen.getByText("SLO Targets are Provisional")).toBeInTheDocument()

    rerender(
      <div>
        <PerformanceCharts metrics={metrics} />
      </div>
    )
    expect(screen.getByText("search.total")).toBeInTheDocument()
  })

  it("refreshes only when the page is visible and online", () => {
    renderWithProviders(<AutoRefresh intervalMs={1000} />, { messages: enMessages })

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(refreshMock).toHaveBeenCalledTimes(1)

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(refreshMock).toHaveBeenCalledTimes(1)
  })
})
