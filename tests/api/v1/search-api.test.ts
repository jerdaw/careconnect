import "../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/v1/search/services/route"
import { ServicePublic } from "@/types/service-public"
import { supabase } from "@/lib/supabase"
import { IntentCategory } from "@/types/service"

// Mock Supabase Singleton
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// Mock Rate Limit
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, reset: 0 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}))

vi.mock("@/lib/resilience/supabase-breaker", () => ({
  withCircuitBreaker: vi.fn((operation: () => Promise<unknown>) => operation()),
}))

describe("Search API (Hybrid Scoring)", () => {
  const mockSelect = vi.fn()
  const mockOr = vi.fn()
  const mockEq = vi.fn()
  let mockQueryResult: { data: ServicePublic[]; error: unknown } = { data: [], error: null }

  const queryBuilder = {
    or: (...args: unknown[]) => mockOr(...args),
    eq: (...args: unknown[]) => mockEq(...args),
    then: (resolve: (value: typeof mockQueryResult) => unknown, reject?: (reason?: unknown) => unknown) =>
      Promise.resolve(mockQueryResult).then(resolve, reject),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: [], error: null }

    mockEq.mockReturnValue(queryBuilder)
    mockOr.mockReturnValue(queryBuilder)
    mockSelect.mockReturnValue(queryBuilder)

    const mockChain = { select: mockSelect }
    vi.mocked(supabase.from).mockReturnValue(mockChain as any)
  })

  const createRequest = (body: Record<string, unknown>) => {
    return new NextRequest("http://localhost:3000/api/v1/search/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  // Helper to create mock service data
  const createMockService = (id: string, overrides: Partial<ServicePublic> = {}): ServicePublic =>
    ({
      id,
      name: `Service ${id}`,
      description: "Description",
      verification_status: "L1",
      last_verified: new Date().toISOString(),
      authority_tier: "community",
      phone: null,
      address: null,
      hours: null,
      scope: "kingston",
      virtual_delivery: false,
      created_at: new Date().toISOString(),
      ...overrides,
    }) as ServicePublic

  it("should rank higher authority tiers above lower ones", async () => {
    const govService = createMockService("gov", { authority_tier: "government" })
    const commService = createMockService("comm", { authority_tier: "community" })

    mockQueryResult = {
      data: [commService, govService],
      error: null,
    }

    const req = createRequest({ query: "service", locale: "en" })
    const res = await POST(req)
    const json = (await res.json()) as { data: { id: string }[] }

    expect(res.status).toBe(200)
    expect(json.data?.[0]?.id).toBe("gov")
    expect(json.data?.[1]?.id).toBe("comm")
  })

  it("should boost services with complete data", async () => {
    const completeService = createMockService("complete", {
      phone: "555-1234",
      address: "123 Main",
    })
    const sparseService = createMockService("sparse")

    mockQueryResult = {
      data: [sparseService, completeService],
      error: null,
    }

    const req = createRequest({ query: "service", locale: "en" })
    const res = await POST(req)
    const json = (await res.json()) as { data: { id: string }[] }

    expect(json.data?.[0]?.id).toBe("complete")
  })

  it("should correct rank by proximity if location provided (Kingston vs Ottawa)", async () => {
    const kingstonService = createMockService("kingston", {
      coordinates: { lat: 44.2312, lng: -76.486 },
    })
    const ottawaService = createMockService("ottawa", {
      coordinates: { lat: 45.4215, lng: -75.6972 },
    })

    mockQueryResult = {
      data: [ottawaService, kingstonService],
      error: null,
    }

    const req = createRequest({
      query: "service",
      locale: "en",
      location: { lat: 44.2334, lng: -76.5 },
    })

    const res = await POST(req)
    const json = (await res.json()) as { data: { id: string }[] }

    expect(json.data?.[0]?.id).toBe("kingston")
  })

  it("should paginate results correctly", async () => {
    const services = Array.from({ length: 5 }, (_, i) => createMockService(`s${i}`))

    mockQueryResult = {
      data: services,
      error: null,
    }

    const req = createRequest({
      query: "service",
      locale: "en",
      options: { limit: 2, offset: 2 },
    })

    const res = await POST(req)
    const json = (await res.json()) as {
      data: { id: string }[]
      meta: { limit: number; offset: number; total: number }
    }

    expect(json.data.length).toBe(2)
    expect(json.meta.limit).toBe(2)
    expect(json.meta.offset).toBe(2)
    expect(json.meta.total).toBe(5)
  })

  it("should exclude services beyond the governance freshness window", async () => {
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 200)

    const expiredService = createMockService("expired", { last_verified: expiredDate.toISOString() })
    const freshService = createMockService("fresh")

    mockQueryResult = {
      data: [expiredService, freshService],
      error: null,
    }

    const req = createRequest({ query: "service", locale: "en" })
    const res = await POST(req)
    const json = (await res.json()) as { data: { id: string }[]; meta: { total: number } }

    expect(json.data).toHaveLength(1)
    expect(json.data[0]?.id).toBe("fresh")
    expect(json.meta.total).toBe(1)
  })

  it("uses no-store for query or location-driven searches", async () => {
    mockQueryResult = {
      data: [createMockService("cached")],
      error: null,
    }

    const req = createRequest({
      query: "",
      locale: "en",
      location: { lat: 44.2334, lng: -76.5 },
    })

    const res = await POST(req)

    expect(res.headers.get("Cache-Control")).toBe("no-store")
  })

  it("allows short public caching for category-only browse", async () => {
    mockQueryResult = {
      data: [createMockService("food", { category: IntentCategory.Food })],
      error: null,
    }

    const req = createRequest({
      query: "",
      locale: "en",
      filters: { category: IntentCategory.Food },
    })

    const res = await POST(req)

    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=60")
  })

  it("keeps synthetic-query-only candidates in play for server ranking parity", async () => {
    mockQueryResult = {
      data: [
        createMockService("intent", {
          name: "Community Wellness Support",
          description: "Peer support and intake help.",
          synthetic_queries: ["help with depression", "low mood"],
        }),
      ],
      error: null,
    }

    const req = createRequest({
      query: "depression",
      locale: "en",
    })

    const res = await POST(req)
    const json = (await res.json()) as { data: { id: string }[] }

    expect(res.status).toBe(200)
    expect(json.data[0]?.id).toBe("intent")
    expect(mockOr).not.toHaveBeenCalled()
  })
})
