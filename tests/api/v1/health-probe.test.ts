/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const { mockGetHealthSnapshot, mockCheckAndAlertSLOViolations, mockRecordUptimeEvent } = vi.hoisted(() => ({
  mockGetHealthSnapshot: vi.fn(),
  mockCheckAndAlertSLOViolations: vi.fn(),
  mockRecordUptimeEvent: vi.fn(),
}))

vi.mock("@/lib/env", () => ({
  env: {
    HEALTH_PROBE_TOKEN: "probe-token",
  },
}))

vi.mock("@/lib/observability/health-check", () => ({
  getHealthSnapshot: mockGetHealthSnapshot,
  checkAndAlertSLOViolations: mockCheckAndAlertSLOViolations,
}))

vi.mock("@/lib/observability/slo-tracker", () => ({
  recordUptimeEvent: mockRecordUptimeEvent,
}))

import { GET } from "@/app/api/v1/health/probe/route"

describe("GET /api/v1/health/probe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetHealthSnapshot.mockResolvedValue({
      basicResponse: {
        status: "healthy",
        timestamp: "2026-04-18T00:00:00.000Z",
        version: "1.0.0",
      },
      detailedResponse: {
        status: "healthy",
        timestamp: "2026-04-18T00:00:00.000Z",
        version: "1.0.0",
        checks: {
          database: { status: "up", latencyMs: 42 },
          circuitBreaker: { enabled: true, state: "CLOSED", stats: { enabled: true, state: "CLOSED" } },
          slo: {
            uptime: { compliant: true, actual: 1, target: 0.995, totalChecks: 10, successfulChecks: 10 },
            errorBudget: { exhausted: false, consumed: 0, remaining: 1, warningThreshold: 0.5 },
            latency: { hasData: false, compliant: true, actualP95: null, target: 800 },
          },
        },
      },
      overallStatus: "healthy",
      isHealthy: true,
      sloCompliance: {
        uptime: { compliant: true, actual: 1, target: 0.995, totalChecks: 10, successfulChecks: 10 },
        errorBudget: { exhausted: false, consumed: 0, remaining: 1, warningThreshold: 0.5 },
        latency: { hasData: false, compliant: true, actualP95: null, target: 800 },
      },
    })
  })

  it("rejects unauthorized probe requests", async () => {
    const response = await GET(new NextRequest("http://localhost:3000/api/v1/health/probe"))
    const json = (await response.json()) as { error: string }

    expect(response.status).toBe(401)
    expect(json.error).toBe("Unauthorized")
    expect(mockRecordUptimeEvent).not.toHaveBeenCalled()
  })

  it("records uptime and checks alerts for authorized probes", async () => {
    const request = new NextRequest("http://localhost:3000/api/v1/health/probe", {
      headers: {
        authorization: "Bearer probe-token",
      },
    })

    const response = await GET(request)
    const json = (await response.json()) as { status: string; checks: Record<string, unknown> }

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0")
    expect(json.status).toBe("healthy")
    expect(json.checks).toHaveProperty("database")
    expect(mockRecordUptimeEvent).toHaveBeenCalledWith(true)
    expect(mockCheckAndAlertSLOViolations).toHaveBeenCalledTimes(1)
  })
})
