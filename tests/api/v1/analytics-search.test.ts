import "../../setup/next-mocks"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "@/app/api/v1/analytics/search/route"
import { trackSearchEvent } from "@/lib/analytics/search-analytics"

vi.mock("@/lib/analytics/search-analytics", () => ({
  trackSearchEvent: vi.fn().mockResolvedValue(undefined),
}))

describe("POST /api/v1/analytics/search", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns privacy headers on success", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/analytics/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "en", resultCount: 3 }),
      })
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex")
    expect(trackSearchEvent).toHaveBeenCalledWith({ locale: "en", resultCount: 3 })
  })

  it("rejects non-json content types", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/analytics/search", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "not-json",
      })
    )

    expect(response.status).toBe(415)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex")
  })

  it("rejects malformed json", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/analytics/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad json",
      })
    )

    expect(response.status).toBe(400)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex")
  })
})
