import "../../setup/next-mocks"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockRequest } from "@/tests/utils/api-test-utils"
import { POST } from "@/app/api/v1/pilot/integration-feasibility/route"

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, reset: 0 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}))

vi.mock("@/lib/pilot/auth", () => ({
  requireAuthenticatedUser: vi.fn(),
}))

vi.mock("@/lib/auth/authorization", () => ({
  isUserAdmin: vi.fn(),
}))

vi.mock("@/lib/pilot/storage", () => ({
  insertIntegrationDecision: vi.fn(),
}))

describe("POST /api/v1/pilot/integration-feasibility", () => {
  const validPayload = {
    decision: "conditional",
    decision_date: "2026-03-08",
    redline_checklist_version: "v1",
    violations: ["retention_policy_conflict"],
    compensating_controls: ["limit retention to aggregate-only snapshots"],
    owners: ["jer"],
  }

  function createRequest(body: unknown = validPayload) {
    return createMockRequest("http://localhost/api/v1/pilot/integration-feasibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  function createNonJsonRequest() {
    return createMockRequest("http://localhost/api/v1/pilot/integration-feasibility", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "not-json",
    })
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { checkRateLimit } = await import("@/lib/rate-limit")
    const { requireAuthenticatedUser } = await import("@/lib/pilot/auth")
    const { isUserAdmin } = await import("@/lib/auth/authorization")
    const { insertIntegrationDecision } = await import("@/lib/pilot/storage")
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, reset: 0 } as never)
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: {} as any,
      user: { id: "user-1" } as any,
    })
    vi.mocked(isUserAdmin).mockResolvedValue(true)
    vi.mocked(insertIntegrationDecision).mockResolvedValue({
      data: {
        id: "decision-1",
        decision: "conditional",
        decision_date: "2026-03-08",
        redline_checklist_version: "v1",
        violations: ["retention_policy_conflict"],
        compensating_controls: ["limit retention to aggregate-only snapshots"],
        owners: ["jer"],
        created_at: "2026-03-08T15:00:00.000Z",
        created_by: "user-1",
      },
      error: null,
      missingTable: false,
    })
  })

  it("returns 429 when rate limited", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit")
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, reset: 0 } as never)

    const res = await POST(createRequest())
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(429)
    expect(json.error.message).toBe("Rate limit exceeded")
  })

  it("returns 401 when auth is missing", async () => {
    const { requireAuthenticatedUser } = await import("@/lib/pilot/auth")
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: null,
      user: null,
    } as never)

    const res = await POST(createRequest())
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(401)
    expect(json.error.message).toBe("Unauthorized")
  })

  it("returns 403 for non-admin user", async () => {
    const { isUserAdmin } = await import("@/lib/auth/authorization")
    vi.mocked(isUserAdmin).mockResolvedValue(false)

    const res = await POST(
      createRequest({
        decision: "blocked",
        decision_date: "2026-03-08",
        redline_checklist_version: "v1",
        violations: ["forced_user_identifying_telemetry"],
        compensating_controls: [],
        owners: ["jer"],
      })
    )
    expect(res.status).toBe(403)
  })

  it("returns 400 for invalid payload", async () => {
    const res = await POST(
      createRequest({
        decision: "go",
        decision_date: "2026-03-08",
        redline_checklist_version: "v1",
        violations: ["raw_query_text_required"],
        compensating_controls: [],
        owners: ["jer"],
      })
    )

    expect(res.status).toBe(400)
  })

  it("returns 415 when content type is not json", async () => {
    const { insertIntegrationDecision } = await import("@/lib/pilot/storage")

    const res = await POST(createNonJsonRequest())
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(415)
    expect(json.error.message).toBe("Content-Type must be application/json")
    expect(insertIntegrationDecision).not.toHaveBeenCalled()
  })

  it("returns 501 when pilot decision storage is not ready", async () => {
    const { insertIntegrationDecision } = await import("@/lib/pilot/storage")
    vi.mocked(insertIntegrationDecision).mockResolvedValue({
      data: null,
      error: { code: "42P01", message: "relation does not exist" },
      missingTable: true,
    })

    const res = await POST(createRequest())
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(501)
    expect(json.error.message).toBe("Pilot storage not ready: missing pilot_integration_feasibility_decisions table")
  })

  it("returns 500 when pilot decision storage fails", async () => {
    const { insertIntegrationDecision } = await import("@/lib/pilot/storage")
    vi.mocked(insertIntegrationDecision).mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
      missingTable: false,
    })

    const res = await POST(createRequest())
    const json = (await res.json()) as { error: { message: string; details: string } }

    expect(res.status).toBe(500)
    expect(json.error.message).toBe("Failed to store integration feasibility decision")
    expect(json.error.details).toBe("database unavailable")
  })

  it("returns 201 for valid payload", async () => {
    const { insertIntegrationDecision } = await import("@/lib/pilot/storage")

    const res = await POST(createRequest())
    const json = (await res.json()) as { data: { success: boolean } }

    expect(res.status).toBe(201)
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(json.data).toEqual({ success: true })
    expect(insertIntegrationDecision).toHaveBeenCalledWith(expect.anything(), validPayload)
  })
})
