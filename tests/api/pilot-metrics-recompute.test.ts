/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthorizationError } from "@/lib/api-utils"
import { createMockRequest } from "@/tests/utils/api-test-utils"
import { POST } from "@/app/api/v1/pilot/metrics/recompute/route"
import { requireAuthenticatedUser } from "@/lib/pilot/auth"
import { assertPermission } from "@/lib/auth/authorization"
import { recomputePilotMetrics } from "@/lib/pilot/recompute"
import { checkRateLimit } from "@/lib/rate-limit"

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  generateErrorId: vi.fn(() => "req-test"),
}))

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
  checkRateLimit: vi.fn(() => Promise.resolve({ success: true })),
  createRateLimitHeaders: vi.fn(() => ({ "Retry-After": "300" })),
}))

vi.mock("@/lib/pilot/auth", () => ({
  requireAuthenticatedUser: vi.fn(),
}))

vi.mock("@/lib/auth/authorization", () => ({
  assertPermission: vi.fn(),
}))

vi.mock("@/lib/pilot/recompute", () => ({
  recomputePilotMetrics: vi.fn(),
}))

describe("POST /api/v1/pilot/metrics/recompute", () => {
  const payload = {
    pilot_cycle_id: "v22-cycle-1",
    org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
  }

  function createRequest(body: unknown = payload) {
    return createMockRequest("http://localhost/api/v1/pilot/metrics/recompute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  function createNonJsonRequest() {
    return createMockRequest("http://localhost/api/v1/pilot/metrics/recompute", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "not-json",
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkRateLimit)
      .mockReset()
      .mockResolvedValue({ success: true } as never)
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: {} as never,
      user: { id: "user-1" },
    } as never)
    vi.mocked(assertPermission).mockResolvedValue("editor" as never)
    vi.mocked(recomputePilotMetrics).mockResolvedValue({
      data: {
        calculatedAt: "2026-03-09T00:00:00.000Z",
        snapshotsWritten: 9,
        scorecard: {
          pilot_cycle_id: "v22-cycle-1",
          generated_at: "2026-03-09T00:00:00.000Z",
          m1_failed_contact_rate: 0.25,
          m2_p50_seconds_to_connection: 120,
          m2_p75_seconds_to_connection: 200,
          m2_p90_seconds_to_connection: 300,
          m3_referral_completion_capture_rate: 0.5,
          m4_freshness_sla_compliance: 0.8,
          m5_repeat_failure_rate: 0.1,
          m6_data_decay_fatal_error_rate: 0.05,
          m7_preference_fit_indicator: 0.75,
        },
      },
      error: null,
      missingTables: [],
    })
  })

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false } as never)

    const response = await POST(createRequest())

    expect(response.status).toBe(429)
    expect(requireAuthenticatedUser).not.toHaveBeenCalled()
  })

  it("blocks when the verified user recompute budget is exhausted", async () => {
    vi.mocked(checkRateLimit)
      .mockResolvedValueOnce({ success: true } as never)
      .mockResolvedValueOnce({ success: false, reset: 4102444800 } as never)

    const response = await POST(createRequest())

    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("300")
    expect(assertPermission).toHaveBeenCalled()
    expect(recomputePilotMetrics).not.toHaveBeenCalled()
  })

  it("blocks when the verified organization recompute budget is exhausted", async () => {
    vi.mocked(checkRateLimit)
      .mockResolvedValueOnce({ success: true } as never)
      .mockResolvedValueOnce({ success: true } as never)
      .mockResolvedValueOnce({ success: false, reset: 4102444800 } as never)

    const response = await POST(createRequest())

    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("300")
    expect(recomputePilotMetrics).not.toHaveBeenCalled()
  })
  it("returns 401 when auth is missing", async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: null,
      user: null,
    } as never)

    const response = await POST(createRequest())
    expect(response.status).toBe(401)
  })

  it("returns 400 for invalid payloads", async () => {
    const response = await POST(createRequest({ pilot_cycle_id: "" }))
    expect(response.status).toBe(400)
  })

  it("returns 415 when content type is not json", async () => {
    const response = await POST(createNonJsonRequest())
    const json = (await response.json()) as { error: { message: string } }

    expect(response.status).toBe(415)
    expect(json.error.message).toBe("Content-Type must be application/json")
    expect(recomputePilotMetrics).not.toHaveBeenCalled()
  })

  it("returns 403 when permission assertion fails", async () => {
    vi.mocked(assertPermission).mockRejectedValue(new AuthorizationError("Access denied"))

    const response = await POST(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(403)
    expect(json.error.message).toBe("Access denied")
  })

  it("returns 501 when required source tables are missing", async () => {
    vi.mocked(recomputePilotMetrics).mockResolvedValue({
      data: null,
      error: null,
      missingTables: ["pilot_service_scope", "pilot_connection_events"],
    })

    const response = await POST(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(501)
    expect(json.error.message).toContain("pilot_service_scope")
    expect(json.error.message).toContain("pilot_connection_events")
  })

  it("returns 500 on recompute errors", async () => {
    vi.mocked(recomputePilotMetrics).mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
      missingTables: [],
    })

    const response = await POST(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(500)
    expect(json.error.message).toBe("Failed to recompute pilot metrics")
  })

  it("returns 200 with scorecard data and no-store header on success", async () => {
    const response = await POST(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(json.data.success).toBe(true)
    expect(json.data.snapshotsWritten).toBe(9)
    expect(json.data.scorecard.m4_freshness_sla_compliance).toBe(0.8)
    expect(checkRateLimit).toHaveBeenCalledTimes(3)
    expect(checkRateLimit).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^[a-f0-9]{64}$/),
      2,
      5 * 60 * 1000,
      "api:v1:pilot:metrics:recompute:user"
    )
    expect(checkRateLimit).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/^[a-f0-9]{64}$/),
      6,
      5 * 60 * 1000,
      "api:v1:pilot:metrics:recompute:org"
    )
  })
})
