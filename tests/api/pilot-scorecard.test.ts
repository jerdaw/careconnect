/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthorizationError } from "@/lib/api-utils"
import { GET } from "@/app/api/v1/pilot/metrics/scorecard/route"
import { createMockRequest } from "@/tests/utils/api-test-utils"
import { checkRateLimit } from "@/lib/rate-limit"
import { requireAuthenticatedUser } from "@/lib/pilot/auth"
import { assertPermission } from "@/lib/auth/authorization"
import { getScorecardByCycle } from "@/lib/pilot/storage"
import { evaluateGate1Thresholds } from "@/lib/observability/pilot-metrics"

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
  checkRateLimit: vi.fn(),
}))

vi.mock("@/lib/pilot/auth", () => ({
  requireAuthenticatedUser: vi.fn(),
}))

vi.mock("@/lib/auth/authorization", () => ({
  assertPermission: vi.fn(),
}))

vi.mock("@/lib/pilot/storage", () => ({
  getScorecardByCycle: vi.fn(),
}))

vi.mock("@/lib/observability/pilot-metrics", () => ({
  evaluateGate1Thresholds: vi.fn(),
}))

describe("GET /api/v1/pilot/metrics/scorecard", () => {
  const mockSupabaseAuth = {} as never
  const baseUrl =
    "http://localhost/api/v1/pilot/metrics/scorecard?pilot_cycle_id=v22-cycle-1&org_id=3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e"
  const scorecard = {
    pilot_cycle_id: "v22-cycle-1",
    generated_at: "2026-03-09T02:14:58.000Z",
    m1_failed_contact_rate: 0.25,
    m2_p50_seconds_to_connection: 120,
    m2_p75_seconds_to_connection: 200,
    m2_p90_seconds_to_connection: 300,
    m3_referral_completion_capture_rate: 0.5,
    m4_freshness_sla_compliance: 0.8,
    m5_repeat_failure_rate: 0.1,
    m6_data_decay_fatal_error_rate: 0.05,
    m7_preference_fit_indicator: 0.75,
  }

  function createRequest(url: string = baseUrl) {
    return createMockRequest(url, { method: "GET" })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as never)
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: mockSupabaseAuth,
      user: { id: "user-1" },
    } as never)
    vi.mocked(assertPermission).mockResolvedValue("viewer" as never)
    vi.mocked(getScorecardByCycle).mockResolvedValue({
      data: scorecard as never,
      error: null,
      missingTable: false,
    })
    vi.mocked(evaluateGate1Thresholds).mockReturnValue({
      failedContactRateReductionPass: true,
      timeToConnectionReductionPass: true,
      freshnessSlaPass: true,
      referralCapturePass: true,
      fatalErrorRatePass: true,
      passedAll: true,
    })
  })

  it("returns 429 when rate limit fails", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false } as never)

    const response = await GET(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(429)
    expect(json.error.message).toBe("Rate limit exceeded")
  })

  it("returns 401 when auth is missing", async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: null,
      user: null,
    } as never)

    const response = await GET(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(401)
    expect(json.error.message).toBe("Unauthorized")
  })

  it("returns 400 when query parameters are invalid", async () => {
    const response = await GET(createRequest("http://localhost/api/v1/pilot/metrics/scorecard"))
    const json = (await response.json()) as any

    expect(response.status).toBe(400)
    expect(json.error.message).toBe("Invalid scorecard query parameters")
  })

  it("returns 403 when permission assertion fails", async () => {
    vi.mocked(assertPermission).mockRejectedValue(new AuthorizationError("Access denied"))

    const response = await GET(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(403)
    expect(json.error.message).toBe("Access denied")
  })

  it("returns 501 when pilot metric storage is not ready", async () => {
    vi.mocked(getScorecardByCycle).mockResolvedValue({
      data: null,
      error: { message: "relation does not exist" },
      missingTable: true,
    })

    const response = await GET(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(501)
    expect(json.error.message).toBe("Pilot storage not ready: missing pilot_metric_snapshots table")
  })

  it("returns 500 when storage returns a non-missing-table error", async () => {
    vi.mocked(getScorecardByCycle).mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
      missingTable: false,
    })

    const response = await GET(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(500)
    expect(json.error.message).toBe("Failed to retrieve pilot scorecard")
    expect(json.error.details).toBe("database unavailable")
  })

  it("returns 404 when scorecard data is not found", async () => {
    vi.mocked(getScorecardByCycle).mockResolvedValue({
      data: null,
      error: null,
      missingTable: false,
    })

    const response = await GET(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(404)
    expect(json.error.message).toBe("Pilot scorecard not found")
  })

  it("returns 200 with scorecard data and no-store header on success", async () => {
    const response = await GET(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(json.data.scorecard).toEqual(scorecard)
    expect(json.data.gate1Evaluation).toBeUndefined()
  })

  it("includes gate1Evaluation only when both baseline params are present", async () => {
    const response = await GET(
      createRequest(`${baseUrl}&baseline_failed_contact_rate=0.5&baseline_p50_seconds_to_connection=180`)
    )
    const json = (await response.json()) as any

    expect(response.status).toBe(200)
    expect(json.data.scorecard).toEqual(scorecard)
    expect(json.data.gate1Evaluation).toEqual({
      failedContactRateReductionPass: true,
      timeToConnectionReductionPass: true,
      freshnessSlaPass: true,
      referralCapturePass: true,
      fatalErrorRatePass: true,
      passedAll: true,
    })
    expect(evaluateGate1Thresholds).toHaveBeenCalledWith(scorecard, 0.5, 180)
  })

  it("omits gate1Evaluation when either baseline param is missing", async () => {
    const response = await GET(createRequest(`${baseUrl}&baseline_failed_contact_rate=0.5`))
    const json = (await response.json()) as any

    expect(response.status).toBe(200)
    expect(json.data.scorecard).toEqual(scorecard)
    expect(json.data.gate1Evaluation).toBeUndefined()
    expect(evaluateGate1Thresholds).not.toHaveBeenCalled()
  })
})
