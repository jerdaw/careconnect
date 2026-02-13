import { describe, it, expect } from "vitest"
import { calculateDistanceKm, getProximityMultiplier, resortByDistance } from "@/lib/search/geo"
import { SearchResult } from "@/lib/search/types"
import { Service, VerificationLevel, IntentCategory, ServiceScope } from "@/types/service"

const createMockService = (overrides: Partial<Service> = {}): Service => ({
  id: "test-id",
  name: "Test Service",
  description: "Test description",
  url: "https://example.com",
  verification_level: VerificationLevel.L1,
  intent_category: IntentCategory.Food,
  provenance: {
    verified_by: "system",
    verified_at: new Date().toISOString(),
    evidence_url: "https://example.com",
    method: "manual",
  },
  identity_tags: [],
  synthetic_queries: [],
  synthetic_queries_fr: [],
  hours: {},
  ...overrides,
})

describe("Geo - Distance Calculation", () => {
  describe("calculateDistanceKm", () => {
    it("should return 0 for the same point", () => {
      const distance = calculateDistanceKm(44.2312, -76.486, 44.2312, -76.486)
      expect(distance).toBe(0)
    })

    it("should calculate Kingston to Toronto distance (±5km tolerance)", () => {
      // Kingston City Hall: 44.2312, -76.4860
      // Toronto City Hall: 43.6532, -79.3832
      const distance = calculateDistanceKm(44.2312, -76.486, 43.6532, -79.3832)
      // Expected distance is approximately 241 km (great circle)
      expect(distance).toBeGreaterThan(236)
      expect(distance).toBeLessThan(246)
    })

    it("should calculate Kingston to Ottawa distance (±5km tolerance)", () => {
      // Kingston: 44.2312, -76.4860
      // Ottawa: 45.4215, -75.6972
      const distance = calculateDistanceKm(44.2312, -76.486, 45.4215, -75.6972)
      // Expected distance is approximately 150 km
      expect(distance).toBeGreaterThan(145)
      expect(distance).toBeLessThan(155)
    })

    it("should handle negative longitudes", () => {
      const distance = calculateDistanceKm(0, -10, 0, -20)
      expect(distance).toBeGreaterThan(0)
    })

    it("should calculate large distances for antipodal points", () => {
      // Roughly opposite sides of earth
      const distance = calculateDistanceKm(0, 0, 0, 180)
      expect(distance).toBeGreaterThan(19000)
      expect(distance).toBeLessThan(21000)
    })
  })
})

describe("Geo - Proximity Multiplier", () => {
  describe("getProximityMultiplier", () => {
    it("should return 1.0 for zero distance", () => {
      const multiplier = getProximityMultiplier(0, false, false)
      expect(multiplier).toBe(1.0)
    })

    it("should return 1.0 for virtual services regardless of distance", () => {
      const multiplier = getProximityMultiplier(100, true, false)
      expect(multiplier).toBe(1.0)
    })

    it("should apply standard decay at 25km", () => {
      // Formula: 1 / (1 + k * distance)
      // k = 0.02, distance = 25
      // Expected: 1 / (1 + 0.02 * 25) = 1 / 1.5 = 0.667
      const multiplier = getProximityMultiplier(25, false, false)
      expect(multiplier).toBeCloseTo(0.667, 2)
    })

    it("should apply standard decay at 50km", () => {
      // k = 0.02, distance = 50
      // Expected: 1 / (1 + 0.02 * 50) = 1 / 2 = 0.5
      const multiplier = getProximityMultiplier(50, false, false)
      expect(multiplier).toBeCloseTo(0.5, 2)
    })

    it("should apply wide-area decay at 100km", () => {
      // k = 0.005, distance = 100
      // Expected: 1 / (1 + 0.005 * 100) = 1 / 1.5 = 0.667
      const multiplier = getProximityMultiplier(100, false, true)
      expect(multiplier).toBeCloseTo(0.667, 2)
    })

    it("should use reduced decay for wide-area services", () => {
      const standardMultiplier = getProximityMultiplier(100, false, false)
      const wideAreaMultiplier = getProximityMultiplier(100, false, true)
      // Wide area should have less penalty (higher multiplier)
      expect(wideAreaMultiplier).toBeGreaterThan(standardMultiplier)
    })

    it("should approach zero for very large distances", () => {
      const multiplier = getProximityMultiplier(1000, false, false)
      expect(multiplier).toBeLessThan(0.1)
      expect(multiplier).toBeGreaterThan(0)
    })
  })
})

describe("Geo - Resort By Distance", () => {
  describe("resortByDistance", () => {
    const createResult = (
      serviceId: string,
      score: number,
      coords?: { lat: number; lng: number },
      scope?: ServiceScope,
      virtual_delivery?: boolean
    ): SearchResult => ({
      service: createMockService({
        id: serviceId,
        name: `Service ${serviceId}`,
        coordinates: coords,
        scope,
        virtual_delivery,
      }),
      score,
      matchReasons: [],
    })

    it("should sort results by adjusted score in descending order", () => {
      const userLocation = { lat: 44.2312, lng: -76.486 } // Kingston
      const results: SearchResult[] = [
        createResult("nearby", 50, { lat: 44.2312, lng: -76.486 }), // Same location, score stays 50
        createResult("far", 100, { lat: 45.4215, lng: -75.6972 }), // Ottawa, ~150km away
      ]

      const sorted = resortByDistance(results, userLocation)

      // "nearby" should be first despite lower base score (no distance penalty)
      // "far" gets penalized by distance
      expect(sorted[0]!.service.id).toBe("nearby")
      expect(sorted[1]!.service.id).toBe("far")
    })

    it("should preserve full score for virtual services", () => {
      const userLocation = { lat: 44.2312, lng: -76.486 }
      const results: SearchResult[] = [
        createResult("virtual", 80, undefined, undefined, true), // virtual_delivery = true
      ]

      const sorted = resortByDistance(results, userLocation)

      expect(sorted[0]!.score).toBe(80) // Score unchanged
      // Virtual services don't get a proximity match reason added
      expect(sorted[0]!.matchReasons).toEqual([])
    })

    it("should handle services without coordinates gracefully", () => {
      const userLocation = { lat: 44.2312, lng: -76.486 }
      const results: SearchResult[] = [
        createResult("no-coords", 60), // No coordinates, not explicitly virtual
      ]

      const sorted = resortByDistance(results, userLocation)

      // Should not crash, but will have full score penalty (distance = Infinity)
      expect(sorted).toHaveLength(1)
      // No coordinates and not virtual = low multiplier, but no match reason added (distance is Infinity)
      expect((sorted[0] as any).distance).toBe(Infinity)
    })

    it("should add 'Near You' match reason for high proximity (≥80%)", () => {
      const userLocation = { lat: 44.2312, lng: -76.486 }
      const results: SearchResult[] = [
        createResult("very-close", 50, { lat: 44.2812, lng: -76.496 }), // ~6-7km away
      ]

      const sorted = resortByDistance(results, userLocation)

      // At ~6-7km with k=0.02: multiplier ~88-90%, should have "Near You"
      const hasNearYou = sorted[0]!.matchReasons.some((r) => r.includes("Near You"))
      expect(hasNearYou).toBe(true)
    })

    it("should add 'Distance Adjusted' for moderate proximity (<80%)", () => {
      const userLocation = { lat: 44.2312, lng: -76.486 }
      const results: SearchResult[] = [
        createResult("medium-distance", 50, { lat: 44.45, lng: -76.65 }), // ~25km away
      ]

      const sorted = resortByDistance(results, userLocation)

      // At ~25km with k=0.02: multiplier ~67%, should have "Distance Adjusted"
      const hasDistanceAdjusted = sorted[0]!.matchReasons.some((r) => r.includes("Distance Adjusted"))
      expect(hasDistanceAdjusted).toBe(true)
    })

    it("should not add proximity reason for very high proximity (≥95%)", () => {
      const userLocation = { lat: 44.2312, lng: -76.486 }
      const results: SearchResult[] = [
        createResult("same-location", 50, { lat: 44.2312, lng: -76.486 }), // Exactly same
      ]

      const sorted = resortByDistance(results, userLocation)

      // No proximity message when multiplier is essentially 1.0
      const hasProximityReason = sorted[0]!.matchReasons.some(
        (r) => r.includes("Near You") || r.includes("Distance Adjusted")
      )
      expect(hasProximityReason).toBe(false)
    })

    it("should use wide-area decay for provincial/national scope", () => {
      const userLocation = { lat: 44.2312, lng: -76.486 }
      const results: SearchResult[] = [
        createResult("standard", 100, { lat: 45.4215, lng: -75.6972 }, "kingston"), // Ottawa, standard decay
        createResult("wide-area", 100, { lat: 45.4215, lng: -75.6972 }, "ontario"), // Ottawa, wide decay
      ]

      const sorted = resortByDistance(results, userLocation)

      // Wide-area service should have higher adjusted score (less penalty)
      // At ~150km: standard k=0.02 gives 1/(1+3) = 0.25, wide k=0.005 gives 1/(1+0.75) = 0.571
      const standardService = sorted.find((r) => r.service.id === "standard")!
      const wideAreaService = sorted.find((r) => r.service.id === "wide-area")!

      expect(wideAreaService.score).toBeGreaterThan(standardService.score)
    })

    it("should multiply original score by proximity multiplier", () => {
      const userLocation = { lat: 44.2312, lng: -76.486 }
      const originalScore = 100
      const results: SearchResult[] = [
        createResult("test", originalScore, { lat: 44.3, lng: -76.5 }), // ~10km
      ]

      const sorted = resortByDistance(results, userLocation)

      // Score should be reduced but not zero
      expect(sorted[0]!.score).toBeLessThan(originalScore)
      expect(sorted[0]!.score).toBeGreaterThan(0)
    })
  })
})
