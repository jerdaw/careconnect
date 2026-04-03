/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

const { mockGetSLOComplianceSummary, mockSendSLOViolationAlert } = vi.hoisted(() => ({
  mockGetSLOComplianceSummary: vi.fn(() => ({
    uptime: { compliant: true, actual: 1, target: 0.995, totalChecks: 25, successfulChecks: 25 },
    errorBudget: { exhausted: false, consumed: 0, remaining: 1, warningThreshold: 0.5 },
    latency: { hasData: false, compliant: true, actualP95: null, target: 800 },
  })),
  mockSendSLOViolationAlert: vi.fn(),
}))

vi.mock("@/lib/resilience/supabase-breaker", () => ({
  getSupabaseBreakerStats: () => ({
    state: "CLOSED",
    failures: 0,
    successes: 0,
    requests: 0,
    halfOpenRequests: 0,
    totalFailures: 0,
    totalSuccesses: 0,
    lastFailureTime: null,
    lastSuccessTime: null,
  }),
}))

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(),
  hasSupabaseCredentials: () => false,
  SupabaseNotConfiguredError: class SupabaseNotConfiguredError extends Error {},
}))

vi.mock("@/lib/performance/metrics", () => ({
  getMetrics: () => ({}),
}))

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "production",
    NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING: false,
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    reset: Math.floor(Date.now() / 1000) + 60,
  }),
  getClientIp: () => "127.0.0.1",
}))

vi.mock("@/lib/observability/slo-tracker", () => ({
  recordUptimeEvent: vi.fn(),
  getSLOComplianceSummary: mockGetSLOComplianceSummary,
}))

vi.mock("@/lib/integrations/slack", () => ({
  sendSLOViolationAlert: mockSendSLOViolationAlert,
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}))

import { GET } from "@/app/api/v1/health/route"

describe("GET /api/v1/health version reporting", () => {
  const originalAppVersion = process.env.APP_VERSION
  const originalPackageVersion = process.env.npm_package_version

  beforeEach(() => {
    delete process.env.APP_VERSION
    delete process.env.npm_package_version
    mockGetSLOComplianceSummary.mockClear()
    mockSendSLOViolationAlert.mockClear()
    mockGetSLOComplianceSummary.mockReturnValue({
      uptime: { compliant: true, actual: 1, target: 0.995, totalChecks: 25, successfulChecks: 25 },
      errorBudget: { exhausted: false, consumed: 0, remaining: 1, warningThreshold: 0.5 },
      latency: { hasData: false, compliant: true, actualP95: null, target: 800 },
    })
  })

  afterEach(() => {
    if (originalAppVersion === undefined) {
      delete process.env.APP_VERSION
    } else {
      process.env.APP_VERSION = originalAppVersion
    }

    if (originalPackageVersion === undefined) {
      delete process.env.npm_package_version
    } else {
      process.env.npm_package_version = originalPackageVersion
    }
  })

  it("prefers APP_VERSION when present", async () => {
    process.env.APP_VERSION = "release-123"
    process.env.npm_package_version = "0.1.0"

    const response = await GET({} as NextRequest)
    const json = (await response.json()) as { version: string }

    expect(response.status).toBe(503)
    expect(json.version).toBe("release-123")
  })

  it("falls back to npm_package_version when APP_VERSION is absent", async () => {
    process.env.npm_package_version = "0.1.0"

    const response = await GET({} as NextRequest)
    const json = (await response.json()) as { version: string }

    expect(json.version).toBe("0.1.0")
  })

  it("suppresses uptime and error-budget alerts until enough SLO samples exist", async () => {
    mockGetSLOComplianceSummary.mockReturnValue({
      uptime: { compliant: false, actual: 0.5, target: 0.995, totalChecks: 3, successfulChecks: 1 },
      errorBudget: { exhausted: true, consumed: 1, remaining: 0, warningThreshold: 0.5 },
      latency: { hasData: false, compliant: true, actualP95: null, target: 800 },
    })

    await GET({} as NextRequest)

    expect(mockSendSLOViolationAlert).not.toHaveBeenCalled()
  })
})
