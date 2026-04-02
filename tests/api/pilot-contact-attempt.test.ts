/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthorizationError } from "@/lib/api-utils"
import { POST } from "@/app/api/v1/pilot/events/contact-attempt/route"
import { createMockRequest } from "@/tests/utils/api-test-utils"
import { checkRateLimit } from "@/lib/rate-limit"
import { requireAuthenticatedUser } from "@/lib/pilot/auth"
import { assertPermission } from "@/lib/auth/authorization"
import { insertContactAttempt } from "@/lib/pilot/storage"

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
  insertContactAttempt: vi.fn(),
}))

describe("POST /api/v1/pilot/events/contact-attempt", () => {
  const mockSupabaseAuth = {} as never
  const validPayload = {
    pilot_cycle_id: "v22-cycle-1",
    service_id: "kingston-food-bank",
    recorded_by_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
    entity_key_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    attempt_channel: "phone",
    attempt_outcome: "connected",
    attempted_at: "2026-03-08T15:00:00.000Z",
  }

  function createRequest(body: unknown = validPayload, headers: HeadersInit = { "content-type": "application/json" }) {
    return createMockRequest("http://localhost/api/v1/pilot/events/contact-attempt", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as never)
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: mockSupabaseAuth,
      user: { id: "user-1" },
    } as never)
    vi.mocked(assertPermission).mockResolvedValue("admin" as never)
    vi.mocked(insertContactAttempt).mockResolvedValue({
      data: {} as never,
      error: null,
      missingTable: false,
    })
  })

  it("returns 429 when rate limit fails", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false } as never)

    const response = await POST(createRequest())
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

    const response = await POST(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(401)
    expect(json.error.message).toBe("Unauthorized")
  })

  it("returns 415 when content type is not json", async () => {
    const response = await POST(createRequest(validPayload, {}))
    const json = (await response.json()) as any

    expect(response.status).toBe(415)
    expect(json.error.message).toBe("Content-Type must be application/json")
  })

  it("returns 400 for invalid payloads", async () => {
    const response = await POST(
      createRequest({
        ...validPayload,
        attempt_outcome: undefined,
      })
    )
    const json = (await response.json()) as any

    expect(response.status).toBe(400)
    expect(json.error.message).toBe("Invalid contact attempt payload")
  })

  it("returns 400 when a disallowed privacy field is present", async () => {
    const response = await POST(
      createRequest({
        ...validPayload,
        query_text: "i need food",
      })
    )
    const json = (await response.json()) as any

    expect(response.status).toBe(400)
    expect(json.error.message).toBe("Invalid contact attempt payload")
    expect(JSON.stringify(json.error.details)).toContain("query_text")
  })

  it("returns 403 when permission assertion fails", async () => {
    vi.mocked(assertPermission).mockRejectedValue(new AuthorizationError("Access denied"))

    const response = await POST(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(403)
    expect(json.error.message).toBe("Access denied")
  })

  it("returns 501 when pilot storage is not ready", async () => {
    vi.mocked(insertContactAttempt).mockResolvedValue({
      data: null,
      error: { message: "relation does not exist" },
      missingTable: true,
    })

    const response = await POST(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(501)
    expect(json.error.message).toBe("Pilot storage not ready: missing pilot_contact_attempt_events table")
  })

  it("returns 500 when storage returns a non-missing-table error", async () => {
    vi.mocked(insertContactAttempt).mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
      missingTable: false,
    })

    const response = await POST(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(500)
    expect(json.error.message).toBe("Failed to store contact attempt")
    expect(json.error.details).toBe("database unavailable")
  })

  it("returns 201 with success payload and no-store header on success", async () => {
    const response = await POST(createRequest())
    const json = (await response.json()) as any

    expect(response.status).toBe(201)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(json.data).toEqual({ success: true })
    expect(assertPermission).toHaveBeenCalledWith(
      mockSupabaseAuth,
      "user-1",
      validPayload.recorded_by_org_id,
      "canCreateServices"
    )
    expect(insertContactAttempt).toHaveBeenCalledWith(mockSupabaseAuth, validPayload)
  })
})
