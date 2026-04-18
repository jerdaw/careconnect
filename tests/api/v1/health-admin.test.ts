/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

const {
  mockAuthGetUser,
  mockIsUserAdmin,
  mockRateLimit,
  mockSupabaseSelect,
  mockRecordUptimeEvent,
  mockGetSLOComplianceSummary,
} = vi.hoisted(() => ({
  mockAuthGetUser: vi.fn(),
  mockIsUserAdmin: vi.fn(),
  mockRateLimit: vi.fn(),
  mockSupabaseSelect: vi.fn(),
  mockRecordUptimeEvent: vi.fn(),
  mockGetSLOComplianceSummary: vi.fn(() => ({
    uptime: { compliant: true, actual: 1, target: 0.995, totalChecks: 25, successfulChecks: 25 },
    errorBudget: { exhausted: false, consumed: 0, remaining: 1, warningThreshold: 0.5 },
    latency: { hasData: false, compliant: true, actualP95: null, target: 800 },
  })),
}))

vi.mock("@/lib/resilience/supabase-breaker", () => ({
  getSupabaseBreakerStats: () => ({
    enabled: true,
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
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        limit: mockSupabaseSelect,
      }),
    }),
  }),
  hasSupabaseCredentials: () => true,
  SupabaseNotConfiguredError: class SupabaseNotConfiguredError extends Error {},
}))

vi.mock("@/lib/performance/metrics", () => ({
  getMetrics: () => ({}),
}))

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "production",
    NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING: false,
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockRateLimit,
  getClientIp: () => "127.0.0.1",
}))

vi.mock("@/lib/observability/slo-tracker", () => ({
  recordUptimeEvent: mockRecordUptimeEvent,
  getSLOComplianceSummary: mockGetSLOComplianceSummary,
}))

vi.mock("@/lib/integrations/slack", () => ({
  sendSLOViolationAlert: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}))

vi.mock("@/lib/auth/authorization", () => ({
  isUserAdmin: mockIsUserAdmin,
}))

vi.mock("@/lib/config/slo-targets", () => ({
  MIN_SLO_ALERT_SAMPLES: 5,
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockAuthGetUser,
    },
  }),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
  }),
}))

import { GET } from "@/app/api/v1/health/route"

describe("GET /api/v1/health production detail access", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockResolvedValue({
      success: true,
      reset: Math.floor(Date.now() / 1000) + 60,
    })
    mockSupabaseSelect.mockResolvedValue({ error: null })
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })
    mockIsUserAdmin.mockResolvedValue(false)
  })

  it("returns only the basic payload for non-admins in production", async () => {
    const response = await GET({} as NextRequest)
    const json = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      status: "healthy",
    })
    expect(json).not.toHaveProperty("checks")
  })

  it("returns detailed checks for admins in production", async () => {
    mockIsUserAdmin.mockResolvedValue(true)

    const response = await GET({} as NextRequest)
    const json = (await response.json()) as { checks?: Record<string, unknown> }

    expect(response.status).toBe(200)
    expect(json.checks).toBeDefined()
    expect(json.checks).toHaveProperty("database")
    expect(json.checks).toHaveProperty("circuitBreaker")
    expect(json.checks).toHaveProperty("slo")
  })
})
