import services from "@/data/services.json"
import { SUPPORTED_PLACES } from "@/lib/places/registry"
import { serviceServesPlace } from "@/lib/places/coverage"
import { ServiceSchema } from "@/lib/schemas/service"
import { VerificationLevel, type Service } from "@/types/service"
import { describe, expect, it } from "vitest"

const approvedBramptonIds = [
  "brampton-peel-centralized-shelter-intake",
  "brampton-wilkinson-road-shelter",
  "brampton-victim-services-of-peel",
  "brampton-safe-centre-of-peel",
  "brampton-peel-ontario-works-emergency-assistance",
  "brampton-regeneration-marketplace-food-bank",
  "brampton-knights-table-food-bank-meals",
  "brampton-ste-louise-food-bank",
]

const expectedVerificationLevels: Record<string, VerificationLevel> = {
  "brampton-peel-centralized-shelter-intake": VerificationLevel.L2,
  "brampton-wilkinson-road-shelter": VerificationLevel.L2,
  "brampton-victim-services-of-peel": VerificationLevel.L2,
  "brampton-safe-centre-of-peel": VerificationLevel.L2,
  "brampton-peel-ontario-works-emergency-assistance": VerificationLevel.L2,
  "brampton-regeneration-marketplace-food-bank": VerificationLevel.L2,
  "brampton-knights-table-food-bank-meals": VerificationLevel.L1,
  "brampton-ste-louise-food-bank": VerificationLevel.L1,
}

describe("Brampton live launch data", () => {
  it("marks Brampton as a live supported place", () => {
    expect(SUPPORTED_PLACES.find((place) => place.id === "brampton-on")?.status).toBe("live")
  })

  it("publishes the approved small Brampton launch set with explicit coverage", () => {
    for (const id of approvedBramptonIds) {
      const service = services.find((record) => record.id === id) as Service | undefined

      expect(service, `${id} should be in live services.json`).toBeDefined()
      expect(ServiceSchema.safeParse(service).success, `${id} should match the service schema`).toBe(true)
      expect(service?.verification_level).toBe(expectedVerificationLevels[id])
      expect(service?.primary_place_id).toBe("brampton-on")
      expect(service?.scope).toBeUndefined()
      expect(service?.coverage?.length).toBeGreaterThan(0)
      expect(serviceServesPlace(service!, "brampton-on")).toBe(true)
      expect(serviceServesPlace(service!, "kingston-on")).toBe(false)
      expect(service?.published).not.toBe(false)
    }
  })
})
