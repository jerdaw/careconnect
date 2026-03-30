import "../../setup/next-mocks"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockRequest } from "@/tests/utils/api-test-utils"
import { POST } from "@/app/api/v1/pilot/events/referral/route"
import { PATCH } from "@/app/api/v1/pilot/events/referral/[id]/route"

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
  insertReferralEvent: vi.fn(),
  updateReferralEvent: vi.fn(),
}))

describe("pilot referral routes", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { requireAuthenticatedUser } = await import("@/lib/pilot/auth")
    const { insertReferralEvent, updateReferralEvent } = await import("@/lib/pilot/storage")
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: {} as any,
      user: { id: "user-1" } as any,
    })
    vi.mocked(insertReferralEvent).mockResolvedValue({
      data: {
        id: "ref-1",
        pilot_cycle_id: "v22-cycle-1",
        source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
        target_service_id: "svc-2",
        referral_state: "initiated",
        created_at: "2026-03-08T15:00:00.000Z",
        updated_at: "2026-03-08T15:00:00.000Z",
        terminal_at: null,
        failure_reason_code: null,
      },
      error: null,
      missingTable: false,
    })
    vi.mocked(updateReferralEvent).mockResolvedValue({
      data: {
        id: "ref-1",
        pilot_cycle_id: "v22-cycle-1",
        source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
        target_service_id: "svc-2",
        referral_state: "failed",
        created_at: "2026-03-08T15:00:00.000Z",
        updated_at: "2026-03-08T15:10:00.000Z",
        terminal_at: "2026-03-08T15:20:00.000Z",
        failure_reason_code: "unknown_failure",
      },
      error: null,
      missingTable: false,
    })
  })

  it("POST returns 201 for valid payload", async () => {
    const req = createMockRequest("http://localhost/api/v1/pilot/events/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pilot_cycle_id: "v22-cycle-1",
        source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
        target_service_id: "svc-2",
        referral_state: "initiated",
        created_at: "2026-03-08T15:00:00.000Z",
        updated_at: "2026-03-08T15:00:00.000Z",
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("PATCH returns 400 for invalid terminal state update", async () => {
    const req = createMockRequest("http://localhost/api/v1/pilot/events/referral/ref-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
        referral_state: "failed",
        updated_at: "2026-03-08T15:10:00.000Z",
      }),
    })

    const res = await PATCH(req, { params: Promise.resolve({ id: "ref-1" }) })
    expect(res.status).toBe(400)
  })

  it("PATCH returns 501 when pilot table is missing", async () => {
    const { updateReferralEvent } = await import("@/lib/pilot/storage")
    vi.mocked(updateReferralEvent).mockResolvedValue({
      data: null,
      error: { code: "42P01", message: "relation does not exist" },
      missingTable: true,
    })

    const req = createMockRequest("http://localhost/api/v1/pilot/events/referral/ref-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
        referral_state: "failed",
        updated_at: "2026-03-08T15:10:00.000Z",
        terminal_at: "2026-03-08T15:20:00.000Z",
      }),
    })

    const res = await PATCH(req, { params: Promise.resolve({ id: "ref-1" }) })
    expect(res.status).toBe(501)
  })
})
