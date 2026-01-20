/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest"
import { GET } from "@/app/api/v1/services/export/route"
import { NextRequest } from "next/server"

// Mock Next.js headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

// Mock Supabase SSR
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-admin-id" } },
        error: null,
      }),
    },
  }),
}))

// Mock Authorization
vi.mock("@/lib/auth/authorization", () => ({
  assertAdminRole: vi.fn().mockResolvedValue(true),
}))

vi.mock("@/lib/search/data", () => ({
  loadServices: vi.fn().mockResolvedValue([{ id: "s1", name: "Service 1", embedding: [0.1] }]),
}))

describe("Export API", () => {
  it("should return services and embeddings", async () => {
    const request = new NextRequest("http://localhost:3000/api/v1/services/export")
    const response = await GET(request)

    if (response.status !== 200) {
        const json = await response.json()
        console.error("Test failed with:", json)
    }

    expect(response.status).toBe(200)
    const data = (await response.json()) as { count: number; services: any[] }
    expect(data.count).toBe(1)
    expect(data.services[0].id).toBe("s1")
    expect(response.headers.get("Cache-Control")).toContain("public")
    expect(response.headers.get("ETag")).toBeDefined()
  })

  it("should return 304 if ETag matches", async () => {
    const dailyTag = `"${new Date().toISOString().split("T")[0]}"`
    const request = new NextRequest("http://localhost:3000/api/v1/services/export", {
      headers: {
        "If-None-Match": dailyTag,
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(304)
  })
})
