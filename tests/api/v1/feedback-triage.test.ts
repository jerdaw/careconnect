import { describe, it, expect, vi, beforeEach } from "vitest"
import { PATCH } from "@/app/api/v1/feedback/[id]/route"
import { createClient } from "@/utils/supabase/server"

// Mock Supabase
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}))

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockUpdate = vi.fn()

describe("Feedback Triage API", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup Supabase Mock Chain
    const mockSupabase = {
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    }

    ;(createClient as any).mockResolvedValue(mockSupabase)

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      // For update, eq usually returns a promise logic in real supabase,
      // here we just return the spy or promise
      then: (cb: any) => Promise.resolve({ error: null }).then(cb),
    })

    // Default: Authenticated User
    mockGetUser.mockResolvedValue({
      data: { user: { id: "partner-123", email: "partner@example.com" } },
      error: null,
    })
  })

  const feedbackId = "fb-123"
  // Cast params to satisfy Next.js 15 async params requirement
  const params = Promise.resolve({ id: feedbackId }) as Promise<{ id: string }>

  it("returns 401 if not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: "No session" })

    const request = new Request(`http://localhost/api/v1/feedback/${feedbackId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "resolved" }),
    })

    const response = await PATCH(request as any, { params })
    expect(response.status).toBe(401)
  })

  it("returns 403 if user does not own the service", async () => {
    // Mock finding feedback, but owned by different org
    mockSingle.mockResolvedValue({
      data: {
        id: feedbackId,
        service_id: "svc-999",
        services: { org_id: "other-org-456" },
      },
      error: null,
    })

    const request = new Request(`http://localhost/api/v1/feedback/${feedbackId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "resolved" }),
    })

    const response = await PATCH(request as any, { params })
    expect(response.status).toBe(403)
  })

  it("returns 200 and updates status if authorized", async () => {
    // Mock finding feedback owned by user
    mockSingle.mockResolvedValue({
      data: {
        id: feedbackId,
        service_id: "svc-123",
        services: { org_id: "partner-123" },
      },
      error: null,
    })

    // mockEq is already configured in beforeEach to return an object with .then check returning { error: null }
    // so we don't need to override it, which breaks the select chain.

    const request = new Request(`http://localhost/api/v1/feedback/${feedbackId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "resolved" }),
    })

    const response = await PATCH(request as any, { params })
    expect(response.status).toBe(200)

    // Verify update called with correct params
    expect(mockUpdate).toHaveBeenCalledWith({
      status: "resolved",
      resolved_at: expect.any(String),
      resolved_by: "partner@example.com",
    })
  })

  it("returns 400 for invalid status", async () => {
    const request = new Request(`http://localhost/api/v1/feedback/${feedbackId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "super-resolved" }),
    })

    const response = await PATCH(request as any, { params })
    expect(response.status).toBe(400)
  })
})
