import "../../setup/next-mocks"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockRequest } from "@/tests/utils/api-test-utils"
import { POST } from "@/app/api/v1/pilot/events/contact-attempt/route"

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, reset: 0 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}))

vi.mock("@/lib/pilot/auth", () => ({
  requireAuthenticatedUser: vi.fn(),
}))

vi.mock("@/lib/auth/authorization", () => ({
  assertPermission: vi.fn(),
}))

vi.mock("@/lib/pilot/storage", () => ({
  insertContactAttempt: vi.fn(),
}))

describe("POST /api/v1/pilot/events/contact-attempt", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { requireAuthenticatedUser } = await import("@/lib/pilot/auth")
    const { insertContactAttempt } = await import("@/lib/pilot/storage")
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: {} as any,
      user: { id: "user-1" } as any,
    })
    vi.mocked(insertContactAttempt).mockResolvedValue({
      data: {
        id: "evt-1",
        pilot_cycle_id: "v22-cycle-1",
        service_id: "svc-1",
        recorded_by_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
        attempt_channel: "phone",
        attempt_outcome: "connected",
        attempted_at: "2026-03-08T15:00:00.000Z",
        resolved_at: null,
        outcome_notes_code: null,
        created_at: "2026-03-08T15:00:00.000Z",
      },
      error: null,
      missingTable: false,
    })
  })

  it("returns 201 for valid payload", async () => {
    const req = createMockRequest("http://localhost/api/v1/pilot/events/contact-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pilot_cycle_id: "v22-cycle-1",
        service_id: "svc-1",
        recorded_by_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
        attempt_channel: "phone",
        attempt_outcome: "connected",
        attempted_at: "2026-03-08T15:00:00.000Z",
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("returns 400 for invalid payload", async () => {
    const req = createMockRequest("http://localhost/api/v1/pilot/events/contact-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pilot_cycle_id: "v22-cycle-1",
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 501 when pilot table is missing", async () => {
    const { insertContactAttempt } = await import("@/lib/pilot/storage")
    vi.mocked(insertContactAttempt).mockResolvedValue({
      data: null,
      error: { code: "42P01", message: "relation does not exist" },
      missingTable: true,
    })

    const req = createMockRequest("http://localhost/api/v1/pilot/events/contact-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pilot_cycle_id: "v22-cycle-1",
        service_id: "svc-1",
        recorded_by_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
        attempt_channel: "phone",
        attempt_outcome: "connected",
        attempted_at: "2026-03-08T15:00:00.000Z",
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(501)
  })
})
