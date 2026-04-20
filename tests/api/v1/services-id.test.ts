import "../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { DELETE, GET, PATCH, PUT } from "@/app/api/v1/services/[id]/route"
import { createMockRequest } from "@/tests/utils/api-test-utils"
import { createServerClient } from "@supabase/ssr"
import { supabase } from "@/lib/supabase"

const createChainMock = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
})

const publicChain = createChainMock()

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockGetUser = vi.fn()
const tableChains: Record<string, any> = {}

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

function mockServiceAuthorization(options: {
  role: "owner" | "admin" | "editor" | "viewer"
  service?: Record<string, unknown>
  updatedRow?: Record<string, unknown>
}) {
  const servicesChain = createChainMock()
  const membersChain = createChainMock()

  tableChains["services"] = servicesChain
  tableChains["organization_members"] = membersChain

  servicesChain.single.mockResolvedValueOnce({
    data: {
      id: "123",
      org_id: "org-1",
      provenance: { verified_by: "user-1", method: "partner_submission" },
      ...options.service,
    },
    error: null,
  })

  if (options.updatedRow) {
    servicesChain.single.mockResolvedValueOnce({
      data: options.updatedRow,
      error: null,
    })
  }

  membersChain.single.mockResolvedValue({
    data: { role: options.role },
    error: null,
  })

  return { servicesChain, membersChain }
}

describe("API v1 Services [id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    for (const key in tableChains) delete tableChains[key]

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

    it("allows admins to update any service in their organization", async () => {
      const { servicesChain } = mockServiceAuthorization({
        role: "admin",
        updatedRow: { id: "123", name: "Updated" },
      })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated",
          eligibility_notes: "Must be 18+",
          operating_hours: "Mon-Fri 9-5",
        }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(200)
      expect(servicesChain.update).toHaveBeenCalledWith({
        name: "Updated",
        eligibility: "Must be 18+",
        hours_text: "Mon-Fri 9-5",
      })
    })

    it("allows editors to update only their own partner-submitted services", async () => {
      mockServiceAuthorization({
        role: "editor",
        service: {
          provenance: { verified_by: "user-1", method: "partner_submission" },
        },
        updatedRow: { id: "123", name: "Updated by editor" },
      })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated by editor" }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(200)
    })

    it("denies editors when the service is not owned by them", async () => {
      mockServiceAuthorization({
        role: "editor",
        service: {
          provenance: { verified_by: "other-user", method: "partner_submission" },
        },
      })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(403)
    })

    it("denies viewers from mutating services", async () => {
      mockServiceAuthorization({ role: "viewer" })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(403)
    })
  })

  describe("PATCH (Protected)", () => {
    it("allows direct access script updates within the strict partner-edit allowlist", async () => {
      const { servicesChain } = mockServiceAuthorization({
        role: "admin",
        updatedRow: { id: "123", name: "Updated", access_script: "Say hello" },
      })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_script: "Say hello" }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(200)
      expect(servicesChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          access_script: "Say hello",
        })
      )
    })

    it("rejects forbidden or unknown payload keys with 400", async () => {
      mockServiceAuthorization({
        role: "admin",
        updatedRow: { id: "123", name: "Updated" },
      })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(400)
    })
  })

  describe("DELETE (Protected)", () => {
    it("allows owners to delete services", async () => {
      const { servicesChain } = mockServiceAuthorization({
        role: "owner",
      })
      const deleteEq = vi.fn().mockResolvedValue({ error: null })
      servicesChain.update.mockReturnValue({ eq: deleteEq })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "DELETE",
      })
      const res = await DELETE(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(200)
      expect(servicesChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_by: "user-1",
        })
      )
      expect(deleteEq).toHaveBeenCalledWith("id", "123")
    })
  })
})
