import "../../setup/next-mocks"
import { describe, it, expect, vi } from "vitest"
import { GET } from "@/app/api/v1/services/[id]/printable/route"
import { createMockRequest } from "@/tests/utils/api-test-utils"

vi.mock("@/lib/services", () => ({
  getServiceById: vi.fn(),
}))

import { getServiceById } from "@/lib/services"

describe("API v1 Services [id]/printable", () => {
  it("returns 404 when service not found", async () => {
    vi.mocked(getServiceById).mockResolvedValue(null as any)

    const req = createMockRequest("http://localhost/api/v1/services/does-not-exist/printable")
    const res = await GET(req as any, { params: Promise.resolve({ id: "does-not-exist" }) })
    expect(res.status).toBe(404)
  })

  it("uses hours_text when present", async () => {
    vi.mocked(getServiceById).mockResolvedValue({
      id: "svc-1",
      name: "Test Service",
      url: "https://example.com",
      description: "Desc",
      provenance: {
        verified_by: "test",
        verified_at: new Date().toISOString(),
        evidence_url: "https://example.com",
        method: "test",
      },
      verification_level: "L1",
      intent_category: "Community",
      identity_tags: [],
      synthetic_queries: [],
      hours_text: "Mon-Fri 9am-5pm",
    } as any)

    const req = createMockRequest("http://localhost/api/v1/services/svc-1/printable")
    const res = await GET(req as any, { params: Promise.resolve({ id: "svc-1" }) })
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain("Mon-Fri 9am-5pm")
  })

  it("formats structured hours when hours_text is missing", async () => {
    vi.mocked(getServiceById).mockResolvedValue({
      id: "svc-2",
      name: "Test Service 2",
      url: "https://example.com",
      description: "Desc",
      provenance: {
        verified_by: "test",
        verified_at: new Date().toISOString(),
        evidence_url: "https://example.com",
        method: "test",
      },
      verification_level: "L1",
      intent_category: "Community",
      identity_tags: [],
      synthetic_queries: [],
      hours: {
        monday: { open: "09:00", close: "17:00" },
      },
    } as any)

    const req = createMockRequest("http://localhost/api/v1/services/svc-2/printable")
    const res = await GET(req as any, { params: Promise.resolve({ id: "svc-2" }) })
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain("Mon: 09:00 - 17:00")
    expect(html).toContain("Tue: Closed")
  })
})
