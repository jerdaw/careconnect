/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest"
import { GET } from "@/app/api/v1/services/export/route"
import { checkRateLimit } from "@/lib/rate-limit"
import { loadServices } from "@/lib/search/data"

vi.mock("@/lib/search/data", () => ({
  loadServices: vi.fn().mockResolvedValue([
    {
      id: "s1",
      name: "Service 1",
      description: "Description",
      embedding: [0.1],
      published: true,
      verification_level: "L2",
      intent_category: "Food",
      last_verified: "2026-03-01T00:00:00.000Z",
      provenance: null,
    },
  ]),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 59, reset: 4102444800 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  createRateLimitHeaders: vi.fn().mockReturnValue({
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "4102444800",
    "Retry-After": "3600",
  }),
}))

describe("Export API", () => {
  it("should return 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0, reset: 4102444800 })

    const request = new Request("http://localhost:3000/api/v1/services/export")
    const response = await GET(request)
    const json = (await response.json()) as { error: string }

    expect(response.status).toBe(429)
    expect(json.error).toBe("Too many requests. Please try again later.")
    expect(response.headers.get("Retry-After")).toBe("3600")
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0")
    expect(response.headers.get("X-RateLimit-Reset")).toBe("4102444800")
  })

  it("should return services and embeddings", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 59, reset: 4102444800 })

    const request = new Request("http://localhost:3000/api/v1/services/export")
    const response = await GET(request)

    if (response.status !== 200) {
      const json = await response.json()
      console.error("Test failed with:", json)
    }

    expect(response.status).toBe(200)
    const data = (await response.json()) as { count: number; services: any[]; version: string }
    expect(data.count).toBe(1)
    expect(data.services[0].id).toBe("s1")
    expect(data.services[0].provenance).toEqual({
      verified_by: "",
      verified_at: "",
      evidence_url: "",
      method: "",
    })
    expect(response.headers.get("Cache-Control")).toContain("public")
    expect(response.headers.get("ETag")).toBeDefined()
    expect(data.version).toBe(response.headers.get("ETag")?.replaceAll('"', ""))
  })

  it("should return a stable fingerprint for identical payloads", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 59, reset: 4102444800 })

    const firstResponse = await GET(new Request("http://localhost:3000/api/v1/services/export"))
    const firstBody = (await firstResponse.json()) as { version: string }

    const secondResponse = await GET(new Request("http://localhost:3000/api/v1/services/export"))
    const secondBody = (await secondResponse.json()) as { version: string }

    expect(firstBody.version).toBe(secondBody.version)
    expect(firstResponse.headers.get("ETag")).toBe(secondResponse.headers.get("ETag"))
  })

  it("should return 304 if ETag matches the current export fingerprint", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 59, reset: 4102444800 })

    const initialResponse = await GET(new Request("http://localhost:3000/api/v1/services/export"))
    const etag = initialResponse.headers.get("ETag")

    const request = new Request("http://localhost:3000/api/v1/services/export", {
      headers: {
        "If-None-Match": etag || "",
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(304)
  })

  it("should change the fingerprint when the export payload changes", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 59, reset: 4102444800 })

    const initialResponse = await GET(new Request("http://localhost:3000/api/v1/services/export"))
    const initialBody = (await initialResponse.json()) as { version: string }

    vi.mocked(loadServices).mockResolvedValueOnce([
      {
        id: "s1",
        name: "Service 1 Updated",
        description: "Description",
        embedding: [0.1],
        published: true,
        verification_level: "L2",
        intent_category: "Food",
        last_verified: "2026-03-01T00:00:00.000Z",
        provenance: null,
      },
    ] as any)

    const nextResponse = await GET(new Request("http://localhost:3000/api/v1/services/export"))
    const nextBody = (await nextResponse.json()) as { version: string }

    expect(nextBody.version).not.toBe(initialBody.version)
  })
})
