import "../../setup/next-mocks"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthorizationError } from "@/lib/api-utils"
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
  const terminalUpdatePayload = {
    source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
    referral_state: "failed",
    updated_at: "2026-03-08T15:10:00.000Z",
    terminal_at: "2026-03-08T15:20:00.000Z",
    failure_reason_code: "unknown_failure",
  }

  const createPayload = {
    pilot_cycle_id: "v22-cycle-1",
    source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
    target_service_id: "svc-2",
    referral_state: "initiated",
    created_at: "2026-03-08T15:00:00.000Z",
    updated_at: "2026-03-08T15:00:00.000Z",
  }

  function createPostRequest(body: unknown = createPayload) {
    return createMockRequest("http://localhost/api/v1/pilot/events/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  function createNonJsonPostRequest() {
    return createMockRequest("http://localhost/api/v1/pilot/events/referral", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "not-json",
    })
  }

  function createPatchRequest(body: unknown = terminalUpdatePayload) {
    return createMockRequest("http://localhost/api/v1/pilot/events/referral/ref-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  function createNonJsonPatchRequest() {
    return createMockRequest("http://localhost/api/v1/pilot/events/referral/ref-1", {
      method: "PATCH",
      headers: { "Content-Type": "text/plain" },
      body: "not-json",
    })
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { checkRateLimit } = await import("@/lib/rate-limit")
    const { requireAuthenticatedUser } = await import("@/lib/pilot/auth")
    const { assertPermission } = await import("@/lib/auth/authorization")
    const { insertReferralEvent, updateReferralEvent } = await import("@/lib/pilot/storage")
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, reset: 0 } as never)
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: {} as any,
      user: { id: "user-1" } as any,
    })
    vi.mocked(assertPermission).mockResolvedValue("editor" as never)
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
    const { insertReferralEvent } = await import("@/lib/pilot/storage")

    const res = await POST(createPostRequest())
    const json = (await res.json()) as { data: { success: boolean } }

    expect(res.status).toBe(201)
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(json.data).toEqual({ success: true })
    expect(insertReferralEvent).toHaveBeenCalledWith(expect.anything(), createPayload)
  })

  it("POST returns 200 for idempotent retries with a client event id", async () => {
    const { insertReferralEvent } = await import("@/lib/pilot/storage")
    vi.mocked(insertReferralEvent).mockResolvedValue({
      data: null,
      duplicate: true,
      error: null,
      missingTable: false,
    })

    const payload = {
      id: "11111111-1111-4111-8111-111111111111",
      pilot_cycle_id: "v22-cycle-1",
      source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      target_service_id: "svc-2",
      referral_state: "initiated",
      created_at: "2026-03-08T15:00:00.000Z",
      updated_at: "2026-03-08T15:00:00.000Z",
    }
    const req = createMockRequest("http://localhost/api/v1/pilot/events/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(json.data).toEqual({ success: true, duplicate: true })
    expect(insertReferralEvent).toHaveBeenCalledWith(expect.anything(), payload)
  })

  it("POST returns 429 when rate limited", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit")
    const { requireAuthenticatedUser } = await import("@/lib/pilot/auth")
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, reset: 0 } as never)

    const res = await POST(createPostRequest())
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(429)
    expect(json.error.message).toBe("Rate limit exceeded")
    expect(requireAuthenticatedUser).not.toHaveBeenCalled()
  })

  it("POST returns 401 when auth is missing", async () => {
    const { requireAuthenticatedUser } = await import("@/lib/pilot/auth")
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: null,
      user: null,
    } as never)

    const res = await POST(createPostRequest())
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(401)
    expect(json.error.message).toBe("Unauthorized")
  })

  it("POST returns 403 when permission assertion fails", async () => {
    const { assertPermission } = await import("@/lib/auth/authorization")
    vi.mocked(assertPermission).mockRejectedValue(new AuthorizationError("Access denied"))

    const res = await POST(createPostRequest())
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(403)
    expect(json.error.message).toBe("Access denied")
  })

  it("POST returns 400 for invalid payloads", async () => {
    const { insertReferralEvent } = await import("@/lib/pilot/storage")

    const res = await POST(createPostRequest({ pilot_cycle_id: "" }))

    expect(res.status).toBe(400)
    expect(insertReferralEvent).not.toHaveBeenCalled()
  })

  it("POST returns 415 when content type is not json", async () => {
    const { insertReferralEvent } = await import("@/lib/pilot/storage")

    const res = await POST(createNonJsonPostRequest())
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(415)
    expect(json.error.message).toBe("Content-Type must be application/json")
    expect(insertReferralEvent).not.toHaveBeenCalled()
  })

  it("POST returns 501 when pilot table is missing", async () => {
    const { insertReferralEvent } = await import("@/lib/pilot/storage")
    vi.mocked(insertReferralEvent).mockResolvedValue({
      data: null,
      error: { code: "42P01", message: "relation does not exist" },
      missingTable: true,
    })

    const res = await POST(createPostRequest())
    expect(res.status).toBe(501)
  })

  it("POST returns 500 when pilot referral storage fails", async () => {
    const { insertReferralEvent } = await import("@/lib/pilot/storage")
    vi.mocked(insertReferralEvent).mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
      missingTable: false,
    })

    const res = await POST(createPostRequest())
    const json = (await res.json()) as { error: { message: string; details: string } }

    expect(res.status).toBe(500)
    expect(json.error.message).toBe("Failed to store referral event")
    expect(json.error.details).toBe("database unavailable")
  })

  it("PATCH returns 429 when rate limited", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit")
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, reset: 0 } as never)

    const res = await PATCH(createPatchRequest(), { params: Promise.resolve({ id: "ref-1" }) })
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(429)
    expect(json.error.message).toBe("Rate limit exceeded")
  })

  it("PATCH returns 401 when auth is missing", async () => {
    const { requireAuthenticatedUser } = await import("@/lib/pilot/auth")
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: null,
      user: null,
    } as never)

    const res = await PATCH(createPatchRequest(), { params: Promise.resolve({ id: "ref-1" }) })
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(401)
    expect(json.error.message).toBe("Unauthorized")
  })

  it("PATCH returns 403 when permission assertion fails", async () => {
    const { assertPermission } = await import("@/lib/auth/authorization")
    vi.mocked(assertPermission).mockRejectedValue(new AuthorizationError("Access denied"))

    const res = await PATCH(createPatchRequest(), { params: Promise.resolve({ id: "ref-1" }) })
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(403)
    expect(json.error.message).toBe("Access denied")
  })

  it("PATCH returns 400 for invalid terminal state update", async () => {
    const res = await PATCH(
      createPatchRequest({
        source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
        referral_state: "failed",
        updated_at: "2026-03-08T15:10:00.000Z",
      }),
      { params: Promise.resolve({ id: "ref-1" }) }
    )
    expect(res.status).toBe(400)
  })

  it("PATCH returns 415 when content type is not json", async () => {
    const { updateReferralEvent } = await import("@/lib/pilot/storage")

    const res = await PATCH(createNonJsonPatchRequest(), { params: Promise.resolve({ id: "ref-1" }) })
    const json = (await res.json()) as { error: { message: string } }

    expect(res.status).toBe(415)
    expect(json.error.message).toBe("Content-Type must be application/json")
    expect(updateReferralEvent).not.toHaveBeenCalled()
  })

  it("PATCH returns 501 when pilot table is missing", async () => {
    const { updateReferralEvent } = await import("@/lib/pilot/storage")
    vi.mocked(updateReferralEvent).mockResolvedValue({
      data: null,
      error: { code: "42P01", message: "relation does not exist" },
      missingTable: true,
    })

    const res = await PATCH(createPatchRequest(), { params: Promise.resolve({ id: "ref-1" }) })
    expect(res.status).toBe(501)
  })

  it("PATCH returns 500 when pilot referral storage fails", async () => {
    const { updateReferralEvent } = await import("@/lib/pilot/storage")
    vi.mocked(updateReferralEvent).mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
      missingTable: false,
    })

    const res = await PATCH(createPatchRequest(), { params: Promise.resolve({ id: "ref-1" }) })
    const json = (await res.json()) as { error: { message: string; details: string } }

    expect(res.status).toBe(500)
    expect(json.error.message).toBe("Failed to update referral event")
    expect(json.error.details).toBe("database unavailable")
  })

  it("PATCH returns a no-store success envelope for valid terminal updates", async () => {
    const { updateReferralEvent } = await import("@/lib/pilot/storage")

    const res = await PATCH(createPatchRequest(), { params: Promise.resolve({ id: "ref-1" }) })
    const json = (await res.json()) as { data: { success: boolean } }

    expect(res.status).toBe(200)
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(json.data).toEqual({ success: true })
    expect(updateReferralEvent).toHaveBeenCalledWith(expect.anything(), "ref-1", {
      referral_state: terminalUpdatePayload.referral_state,
      updated_at: terminalUpdatePayload.updated_at,
      terminal_at: terminalUpdatePayload.terminal_at,
      failure_reason_code: terminalUpdatePayload.failure_reason_code,
    })
  })
})
