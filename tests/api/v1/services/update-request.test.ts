import "../../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/v1/services/[id]/update-request/route"
import { createMockRequest } from "@/tests/utils/api-test-utils"
import { createServerClient } from "@supabase/ssr"
import { assertServiceOwnership } from "@/lib/auth/authorization"
import { checkRateLimit } from "@/lib/rate-limit"

// Mock authorization
vi.mock("@/lib/auth/authorization", () => ({
  assertServiceOwnership: vi.fn(),
}))

// Mock circuit breaker
vi.mock("@/lib/resilience/supabase-breaker", () => ({
  withCircuitBreaker: vi.fn((fn) => fn()),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 19, reset: 4102444800 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  createRateLimitHeaders: vi.fn().mockReturnValue({
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "4102444800",
    "Retry-After": "3600",
  }),
}))

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

const createChainMock = () => ({
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
})

const mockGetUser = vi.fn()
const tableChains: Record<string, ReturnType<typeof createChainMock>> = {}

vi.mocked(createServerClient).mockReturnValue({
  auth: {
    getUser: mockGetUser,
  },
  from: (table: string) => {
    if (!tableChains[table]) {
      tableChains[table] = createChainMock()
    }
    return tableChains[table]
  },
} as any)

describe("POST /api/v1/services/[id]/update-request", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const key in tableChains) delete tableChains[key]

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1", email: "user@example.com" } }, error: null })
    vi.mocked(assertServiceOwnership).mockResolvedValue(undefined as any)
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 19, reset: 4102444800 })
  })

  it("returns 401 if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field_updates: { name: "New Name" } }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(401)
    expect(json.error.message).toBe("Unauthorized")
  })

  it("returns 403 if user does not own the service", async () => {
    const { AuthorizationError } = await import("@/lib/api-utils")
    vi.mocked(assertServiceOwnership).mockRejectedValue(new AuthorizationError("Forbidden"))

    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field_updates: { name: "New Name" } }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })

    expect(res.status).toBe(403) // handleApiError returns 403 for AuthorizationError
    expect(vi.mocked(assertServiceOwnership)).toHaveBeenCalledWith(expect.anything(), "user-1", "svc-123")
  })

  it("returns 415 if content-type is not application/json", async () => {
    const req = new Request("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: "plain text",
    })

    const res = await POST(req as any, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(415) // ValidationError returns 415
    expect(json.error.message).toContain("application/json")
  })

  it("returns 400 if field_updates contains disallowed fields", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_updates: {
          malicious_field: "attack",
          name: "Legit Name",
        },
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.error.message).toBe("Invalid update data")
  })

  it("returns 400 if field_updates is missing", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ justification: "Just fixing a typo" }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.error.message).toBe("Invalid update data")
  })

  it("returns 400 if field_updates is empty", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field_updates: {} }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.error.message).toBe("Invalid update data")
  })

  it("accepts valid update request with allowed fields", async () => {
    const validUpdates = {
      field_updates: {
        name: "Updated Service Name",
        phone: "613-555-1234",
        hours_text: "Mon-Fri 9am-5pm",
      },
      justification: "Updating contact info per provider request",
    }

    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validUpdates),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.data.success).toBe(true)
    expect(json.data.message).toBe("Update request submitted")

    // Verify insert was called with correct data
    const insertMock = tableChains["service_update_requests"]?.insert
    expect(insertMock).toHaveBeenCalledWith({
      service_id: "svc-123",
      requested_by: "user@example.com",
      field_updates: validUpdates.field_updates,
      justification: validUpdates.justification,
      status: "pending",
    })
  })

  it("normalizes the operating_hours alias to hours_text before storing the request", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_updates: {
          operating_hours: "Mon-Fri 9-5",
        },
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.data.success).toBe(true)
    expect(tableChains["service_update_requests"]?.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        field_updates: {
          operating_hours: "Mon-Fri 9-5",
          hours_text: "Mon-Fri 9-5",
        },
      })
    )
  })

  it("accepts update request without justification (optional field)", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_updates: { name: "New Name" },
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.data.success).toBe(true)
  })

  it("accepts null clears for optional fields", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_updates: { phone: null, hours_text: null },
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.data.success).toBe(true)
    expect(tableChains["service_update_requests"]?.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        field_updates: { phone: null, hours_text: null },
      })
    )
  })

  it("returns 400 if a required field is cleared with null", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_updates: { name: null },
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.error.message).toBe("Invalid update data")
  })

  it("accepts all allowed update fields", async () => {
    const allAllowedFields = {
      field_updates: {
        name: "New Name",
        name_fr: "Nouveau Nom",
        description: "New Description",
        description_fr: "Nouvelle Description",
        phone: "613-555-1234",
        url: "https://new.example.com",
        address: "123 New St",
        hours_text: "Mon-Fri 9-5",
        eligibility_notes: "New eligibility",
        eligibility_notes_fr: "Nouvelle éligibilité",
        access_script: "New access",
        access_script_fr: "Nouvel accès",
      },
    }

    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allAllowedFields),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.data.success).toBe(true)
  })

  it("returns 400 for invalid phone format", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_updates: { phone: "call me maybe" },
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.error.message).toBe("Invalid update data")
  })

  it("returns 400 when a no-longer-supported field is submitted", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_updates: { email: "new@example.com" },
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.error.message).toBe("Invalid update data")
  })

  it("returns 400 for invalid URL format", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_updates: { url: "not-a-url" },
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.error.message).toBe("Invalid update data")
  })

  it("returns 400 when a string field receives an object", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_updates: {
          name: { first: "Test" },
        },
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.error.message).toBe("Invalid update data")
  })

  it("returns 400 if justification exceeds 500 characters", async () => {
    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_updates: { name: "Updated Name" },
        justification: "x".repeat(501),
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.error.message).toBe("Invalid update data")
  })

  it("returns 500 if database insert fails", async () => {
    tableChains["service_update_requests"] = {
      insert: vi.fn().mockResolvedValue({ data: null, error: { message: "DB Error" } }),
    } as any

    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ field_updates: { name: "New Name" } }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(500)
    expect(json.error.message).toBe("Failed to submit update request")
  })

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0, reset: 4102444800 })

    const req = createMockRequest("http://localhost/api/v1/services/svc-123/update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field_updates: { name: "New Name" } }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(429)
    expect(json.error.message).toBe("Too many requests. Please try again later.")
    expect(res.headers.get("Retry-After")).toBe("3600")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
    expect(res.headers.get("X-RateLimit-Reset")).toBe("4102444800")
  })
})
