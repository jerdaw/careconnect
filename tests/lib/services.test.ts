import { beforeEach, describe, expect, it, vi } from "vitest"
import { getServiceById, updateService } from "@/lib/services"
import { supabase } from "@/lib/supabase"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { IntentCategory, VerificationLevel } from "@/types/service"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
  hasSupabaseCredentials: vi.fn(() => true),
}))

vi.mock("@/lib/resilience/supabase-breaker", () => ({
  withCircuitBreaker: vi.fn((operation) => operation()),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}))

vi.mock("@/data/services.json", () => ({
  default: [
    {
      id: "service-1",
      name: "Static Service",
      description: "Static description",
      url: "https://careconnect.ing/service-1",
      verification_level: VerificationLevel.L2,
      intent_category: IntentCategory.Food,
      provenance: {
        verified_by: "Static Verifier",
        verified_at: "2026-01-01T00:00:00Z",
        evidence_url: "https://careconnect.ing/evidence/service-1",
        method: "phone",
      },
      identity_tags: [{ tag: "youth", evidence_url: "https://careconnect.ing/evidence/tag" }],
      synthetic_queries: ["food help"],
    },
  ],
}))

describe("getServiceById", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the DB-backed public row without overlaying static metadata", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "service-1",
        name: "Database Service",
        description: "Database description",
        url: "https://careconnect.ing/database-service",
        category: IntentCategory.Food,
        verification_status: VerificationLevel.L2,
        last_verified: "2026-03-19T02:03:19.976Z",
        tags: null,
        provenance: null,
      },
      error: null,
    })

    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    const service = await getServiceById("service-1")

    expect(withCircuitBreaker).toHaveBeenCalled()
    expect(service).not.toBeNull()
    expect(service?.name).toBe("Database Service")
    expect(service?.provenance).toEqual({
      verified_by: "",
      verified_at: "",
      evidence_url: "",
      method: "",
    })
    expect(service?.identity_tags).toEqual([])
    expect(service?.synthetic_queries).toEqual([])
  })

  it("parses JSON-backed fields from the services_public row", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "service-1",
        name: "Database Service",
        description: "Database description",
        url: "https://careconnect.ing/database-service",
        category: IntentCategory.Food,
        verification_status: VerificationLevel.L2,
        last_verified: "2026-03-19T02:03:19.976Z",
        tags: JSON.stringify([{ tag: "families", evidence_url: "https://careconnect.ing/evidence/families" }]),
        provenance: JSON.stringify({
          verified_by: "Runtime Verifier",
          verified_at: "2026-03-18T00:00:00Z",
          evidence_url: "",
          method: "",
        }),
        hours: JSON.stringify({
          monday: { open: "09:00", close: "17:00" },
        }),
      },
      error: null,
    })

    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    const service = await getServiceById("service-1")

    expect(service?.identity_tags).toEqual([
      { tag: "families", evidence_url: "https://careconnect.ing/evidence/families" },
    ])
    expect(service?.provenance?.verified_by).toBe("Runtime Verifier")
    expect(service?.hours).toEqual({
      monday: { open: "09:00", close: "17:00" },
    })
  })

  it("falls back to static service data when the DB lookup fails", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: "PGRST500",
        message: "boom",
      },
    })

    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    const service = await getServiceById("service-1")

    expect(service?.name).toBe("Static Service")
    expect(service?.synthetic_queries).toEqual(["food help"])
    expect(service?.provenance?.verified_by).toBe("Static Verifier")
  })

  it("does not refresh last_verified during generic service updates", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ update } as any)

    const result = await updateService("service-1", {
      name: "Updated Service",
      description: "Updated description",
    })

    expect(result).toEqual({ success: true })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Updated Service",
        description: "Updated description",
      })
    )
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ last_verified: expect.any(String) }))
  })
})
