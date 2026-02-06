import "../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { PATCH } from "@/app/api/v1/feedback/[id]/route"
import { createServerClient } from "@supabase/ssr"

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockUpdate = vi.fn()

describe("Feedback Triage API", () => {
  const mockSupabase = {
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (table === "services") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { org_id: "partner-123" }, error: null }),
            }),
          }),
        }
      }
      if (table === "organization_members") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { role: "admin" }, error: null }),
              }),
            }),
          }),
        }
      }
      return {
        select: mockSelect,
        update: mockUpdate,
      }
    },
  }

  // Standard SSR mocking via next-mocks
  vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

  beforeEach(() => {
    vi.clearAllMocks()

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      then: (cb: any) => Promise.resolve({ error: null }).then(cb),
    })

    // Default: Authenticated User
    mockGetUser.mockResolvedValue({
      data: { user: { id: "partner-123", email: "partner@example.com" } },
      error: null,
    })
  })

  const feedbackId = "fb-123"
  const params = Promise.resolve({ id: feedbackId }) as Promise<{ id: string }>

  it("returns 401 if not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: "No session" })

    const request = new Request(`http://localhost/api/v1/feedback/${feedbackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    })

    const response = await PATCH(request as any, { params })
    expect(response.status).toBe(401)
  })

  it("returns 403 if user does not own the service", async () => {
    // Override the "from" behavior for this specific test to fail ownership
    const restrictedSupabase = {
      ...mockSupabase,
      from: (table: string) => {
        if (table === "feedback") {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { service_id: "svc-999" }, error: null }),
              }),
            }),
          }
        }
        if (table === "services") {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { org_id: "other-org-456" }, error: null }),
              }),
            }),
          }
        }
        if (table === "organization_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: null, error: { message: "Not a member" } }),
                }),
              }),
            }),
          }
        }
        return mockSupabase.from(table)
      },
    }
    vi.mocked(createServerClient).mockReturnValueOnce(restrictedSupabase as any)

    const request = new Request(`http://localhost/api/v1/feedback/${feedbackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    })

    const response = await PATCH(request as any, { params })
    expect(response.status).toBe(403)
  })

  it("returns 200 and updates status if authorized", async () => {
    // Mock feedback data
    mockSingle.mockResolvedValue({
      data: { service_id: "svc-123" },
      error: null,
    })

    const request = new Request(`http://localhost/api/v1/feedback/${feedbackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    })

    const response = await PATCH(request as any, { params })
    expect(response.status).toBe(200)

    expect(mockUpdate).toHaveBeenCalledWith({
      status: "resolved",
      resolved_at: expect.any(String),
      resolved_by: "partner@example.com",
    })
  })

  it("returns 400 for invalid status", async () => {
    const request = new Request(`http://localhost/api/v1/feedback/${feedbackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "super-resolved" }),
    })

    const response = await PATCH(request as any, { params })
    expect(response.status).toBe(400)
  })
})
