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
  beforeEach(async () => {
    vi.clearAllMocks()
    const { requireAuthenticatedUser } = await import("@/lib/pilot/auth")
    const { isUserAdmin } = await import("@/lib/auth/authorization")
    const { insertIntegrationDecision } = await import("@/lib/pilot/storage")
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

  it("returns 403 for non-admin user", async () => {
    const { isUserAdmin } = await import("@/lib/auth/authorization")
    vi.mocked(isUserAdmin).mockResolvedValue(false)

    const req = createMockRequest("http://localhost/api/v1/pilot/integration-feasibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision: "blocked",
        decision_date: "2026-03-08",
        redline_checklist_version: "v1",
        violations: ["forced_user_identifying_telemetry"],
        compensating_controls: [],
        owners: ["jer"],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it("returns 400 for invalid payload", async () => {
    const req = createMockRequest("http://localhost/api/v1/pilot/integration-feasibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision: "go",
        decision_date: "2026-03-08",
        redline_checklist_version: "v1",
        violations: ["raw_query_text_required"],
        compensating_controls: [],
        owners: ["jer"],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 201 for valid payload", async () => {
    const req = createMockRequest("http://localhost/api/v1/pilot/integration-feasibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision: "conditional",
        decision_date: "2026-03-08",
        redline_checklist_version: "v1",
        violations: ["retention_policy_conflict"],
        compensating_controls: ["limit retention to aggregate-only snapshots"],
        owners: ["jer"],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
