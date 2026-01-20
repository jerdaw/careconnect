import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/admin/data/route"
import { parseResponse } from "../../utils/api-test-utils"
import fs from "fs/promises"
import { assertAdminRole } from "@/lib/auth/authorization"

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

// Mock @supabase/ssr
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
}
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockSupabase),
}))

// Mock authorization
vi.mock("@/lib/auth/authorization", () => ({
  assertAdminRole: vi.fn(),
}))

// Mock fs/promises
vi.mock("fs/promises", () => ({
  default: {
    readFile: vi.fn(),
  },
}))

describe("Admin Data API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null })
    vi.mocked(assertAdminRole).mockResolvedValue(undefined as any)
  })

  it("returns raw data when requested by admin", async () => {
    const mockData = [{ id: "1", name: "Service" }]
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData))

    const res = await GET()
    const { data } = await parseResponse<{ data: { services: any[] } }>(res)

    expect(res.status).toBe(200)
    expect(data.data.services).toEqual(mockData)
  })

  it("returns 401 if not logged in", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await GET()
    expect(res.status).toBe(401)
  })
})
