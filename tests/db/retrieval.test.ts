import { beforeEach, describe, expect, it, vi } from "vitest"
import { seededIds } from "./helpers"

describe("DB retrieval", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("loads services from the database with parsed structured fields", async () => {
    const { loadServices } = await import("@/lib/search/data")

    const services = await loadServices()
    const ids = services.map((service) => service.id).sort()

    expect(ids).toEqual([seededIds.crisis988, seededIds.food, seededIds.housingFr].sort())

    const food = services.find((service) => service.id === seededIds.food)
    expect(food?.verification_level).toBe("L2")
    expect(food?.intent_category).toBe("Food")
    expect(food?.identity_tags).toEqual([
      {
        tag: "families",
        evidence_url: "https://example.test/evidence/families",
      },
    ])
    expect(food?.embedding).toEqual([0.1, 0.2, 0.3])

    const crisis = services.find((service) => service.id === seededIds.crisis988)
    expect(crisis?.synthetic_queries).toContain("suicide help")
    expect(crisis?.embedding?.length).toBe(384)
  })

  it("maps services_public rows into the internal Service shape", async () => {
    const { getServiceById } = await import("@/lib/services")

    const service = await getServiceById(seededIds.housingFr)

    expect(service).not.toBeNull()
    expect(service?.name_fr).toContain("Centre d'acces")
    expect(service?.hours).toEqual({
      tuesday: { open: "10:00", close: "18:00" },
    })
    expect(service?.coordinates).toEqual({
      lat: 44.234,
      lng: -76.5,
    })
    expect(service?.provenance).toEqual({
      verified_by: "Test Verifier",
      verified_at: "2026-03-05T12:00:00Z",
      evidence_url: "https://example.test/evidence/housing",
      method: "email",
    })
    expect(service?.identity_tags).toEqual([
      {
        tag: "newcomers",
        evidence_url: "https://example.test/evidence/newcomers",
      },
    ])
  })
})
