import "../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, PUT } from "@/app/api/v1/services/[id]/route"
import { createMockRequest } from "@/tests/utils/api-test-utils"
import { createServerClient } from "@supabase/ssr"
import { supabase } from "@/lib/supabase"

// --- Mock Setup for Chaining Supabase Calls ---

const createChainMock = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
})

const publicChain = createChainMock()

// Mock 'lib/supabase' (Public Client)
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockGetUser = vi.fn()

// Persistent chains for the SSR client to handle multiple .from() calls
const tableChains: Record<string, any> = {}

// Standard SSR mocking via next-mocks
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

describe("API v1 Services [id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Clear the persistent table chains
    for (const key in tableChains) delete tableChains[key]

    // Link public client mock (used in GET)
    vi.mocked(supabase.from).mockReturnValue(publicChain as any)
    publicChain.single.mockResolvedValue({ data: { id: "123", name: "Test Service" }, error: null })

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
  })

  describe("GET (Public)", () => {
    it("returns 400 if ID is missing", async () => {
      const req = createMockRequest("http://localhost/api/v1/services/")
      const res = await GET(req, { params: Promise.resolve({ id: "" }) })
      expect(res.status).toBe(400)
    })

    it("returns 404 if service not found", async () => {
      publicChain.single.mockResolvedValue({ data: null, error: { message: "Not found" } })

      const req = createMockRequest("http://localhost/api/v1/services/999")
      const res = await GET(req, { params: Promise.resolve({ id: "999" }) })

      expect(res.status).toBe(404)
    })

    it("returns 200 and service data if found", async () => {
      const req = createMockRequest("http://localhost/api/v1/services/123")
      const res = await GET(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(200)
      const body = (await res.json()) as { data: any }
      expect(body.data).toHaveProperty("id", "123")
    })
  })

  describe("PUT (Protected)", () => {
    it("returns 401 if not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: "Unauth" })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(401)
    })

    it("updates service and returns 200", async () => {
      // 1. services table: first call for ownership, second for update
      const servicesChain = createChainMock()
      tableChains["services"] = servicesChain
      servicesChain.single.mockResolvedValueOnce({ data: { org_id: "org-1" }, error: null }) // Ownership
      servicesChain.single.mockResolvedValueOnce({ data: { id: "123", name: "Updated" }, error: null }) // Update

      // 2. organization_members table: check membership
      const membersChain = createChainMock()
      tableChains["organization_members"] = membersChain
      membersChain.single.mockResolvedValue({ data: { role: "admin" }, error: null })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(200)
      const body = (await res.json()) as { data: any }
      expect(body.data.name).toBe("Updated")
    })

    it("returns 500 if database update fails", async () => {
      const servicesChain = createChainMock()
      tableChains["services"] = servicesChain
      servicesChain.single.mockResolvedValueOnce({ data: { org_id: "org-1" }, error: null }) // Ownership
      servicesChain.single.mockResolvedValueOnce({ data: null, error: { message: "DB Error" } }) // Update fails

      const membersChain = createChainMock()
      tableChains["organization_members"] = membersChain
      membersChain.single.mockResolvedValue({ data: { role: "admin" }, error: null })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(500)
    })
  })
})
