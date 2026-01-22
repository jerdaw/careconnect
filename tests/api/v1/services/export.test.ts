/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest"
import { GET } from "@/app/api/v1/services/export/route"

vi.mock("@/lib/search/data", () => ({
  loadServices: vi.fn().mockResolvedValue([{ id: "s1", name: "Service 1", embedding: [0.1] }]),
}))

describe("Export API", () => {
  it("should return services and embeddings", async () => {
    const request = new Request("http://localhost:3000/api/v1/services/export")
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
    const request = new Request("http://localhost:3000/api/v1/services/export", {
      headers: {
        "If-None-Match": dailyTag,
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(304)
  })
})
