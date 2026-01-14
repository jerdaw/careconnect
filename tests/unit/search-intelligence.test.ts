import { describe, it, expect } from "vitest"
import { expandQuery } from "@/lib/search/synonyms"
import { detectQueryPattern } from "@/lib/analytics/zero-results"
import { getSuggestion } from "@/lib/search/fuzzy"
import { 
  getAuthorityMultiplier, 
  getCompletenessBoost, 
  getIntentTargetingBoost,
  getResourceBoost,
  WEIGHTS
} from "@/lib/search/scoring"
import { getProximityMultiplier, PROXIMITY_CONFIG } from "@/lib/search/geo"
import { Service, VerificationLevel, IntentCategory } from "@/types/service"

// Minimal test service factory
function createTestService(overrides: Partial<Service> = {}): Service {
  return {
    id: "test-service",
    name: "Test Service",
    description: "A test service",
    url: "https://example.com",
    verification_level: VerificationLevel.L1,
    intent_category: IntentCategory.Community,
    provenance: { verified_by: "test", verified_at: new Date().toISOString(), evidence_url: "", method: "test" },
    identity_tags: [],
    synthetic_queries: [],
    ...overrides,
  }
}

describe("Synonym Expansion", () => {
  it("should expand common terms", () => {
    const expanded = expandQuery(["food"])
    expect(expanded).toContain("hungry")
    expect(expanded).toContain("meal")
    expect(expanded).toContain("groceries")
  })

  it("should handle multiple tokens", () => {
    const expanded = expandQuery(["food", "rent"])
    expect(expanded).toContain("hungry")
    expect(expanded).toContain("housing")
    expect(expanded).toContain("eviction")
  })

  it("should be idempotent", () => {
    const expanded = expandQuery(["food", "food"])
    const count = expanded.filter((t) => t === "food").length
    expect(count).toBe(1)
  })
})

describe("Zero-Result Hashing", () => {
  it("should hash consistent patterns", async () => {
    // "food bank" and "bank food" should produce same hash
    const hash1 = await detectQueryPattern(["food", "bank"])
    const hash2 = await detectQueryPattern(["bank", "food"])
    expect(hash1).toBe(hash2)
    expect(hash1.length).toBeGreaterThan(0)
  })

  it("should produce different hashes for different intents", async () => {
    const hash1 = await detectQueryPattern(["food"])
    const hash2 = await detectQueryPattern(["housing"])
    expect(hash1).not.toBe(hash2)
  })
})

describe("Fuzzy Matching", () => {
  it("should suggest corrections for typos", () => {
    // "martha" is in dictionary, "marth" is typo
    expect(getSuggestion("marth")).toBe("martha")
    // "housing" -> "housng"
    expect(getSuggestion("housng")).toBe("housing")
  })

  it("should ignore short words", () => {
    expect(getSuggestion("ab")).toBe(null)
  })

  it("should ignore numbers", () => {
    expect(getSuggestion("123")).toBe(null)
  })
})

// v16.0: New scoring function tests
describe("Authority Multiplier", () => {
  it("should return highest multiplier for government tier", () => {
    expect(getAuthorityMultiplier("government")).toBe(WEIGHTS.authorityGovernment)
    expect(getAuthorityMultiplier("government")).toBe(1.25)
  })

  it("should return healthcare multiplier for healthcare tier", () => {
    expect(getAuthorityMultiplier("healthcare")).toBe(WEIGHTS.authorityHealthcare)
    expect(getAuthorityMultiplier("healthcare")).toBe(1.20)
  })

  it("should return established nonprofit multiplier", () => {
    expect(getAuthorityMultiplier("established_nonprofit")).toBe(WEIGHTS.authorityEstablishedNonprofit)
    expect(getAuthorityMultiplier("established_nonprofit")).toBe(1.15)
  })

  it("should return 1.0 for community tier", () => {
    expect(getAuthorityMultiplier("community")).toBe(1.0)
  })

  it("should return penalty for unverified tier", () => {
    expect(getAuthorityMultiplier("unverified")).toBe(WEIGHTS.authorityUnverified)
    expect(getAuthorityMultiplier("unverified")).toBe(0.95)
  })

  it("should return 1.0 for undefined tier", () => {
    expect(getAuthorityMultiplier(undefined)).toBe(1.0)
  })
})

describe("Completeness Boost", () => {
  it("should return 0 for empty service", () => {
    const service = createTestService()
    const result = getCompletenessBoost(service)
    expect(result.boost).toBe(0)
    expect(result.reasons).toHaveLength(0)
  })

  it("should boost for phone", () => {
    const service = createTestService({ phone: "613-555-1234" })
    const result = getCompletenessBoost(service)
    expect(result.boost).toBe(WEIGHTS.completenessPhone)
  })

  it("should boost for address", () => {
    const service = createTestService({ address: "123 Main St" })
    const result = getCompletenessBoost(service)
    expect(result.boost).toBe(WEIGHTS.completenessAddress)
  })

  it("should boost cumulatively for multiple fields", () => {
    const service = createTestService({
      phone: "613-555-1234",
      address: "123 Main St",
      eligibility_notes: "Open to all",
    })
    const result = getCompletenessBoost(service)
    expect(result.boost).toBe(
      WEIGHTS.completenessPhone + 
      WEIGHTS.completenessAddress + 
      WEIGHTS.completenessEligibility
    )
  })

  it("should cap at maximum", () => {
    const service = createTestService({
      phone: "613-555-1234",
      address: "123 Main St",
      hours: { monday: { open: "09:00", close: "17:00" } },
      accessibility: { wheelchair: true },
      eligibility_notes: "Open to all",
      application_process: "Walk in",
    })
    const result = getCompletenessBoost(service)
    expect(result.boost).toBe(WEIGHTS.completenessMax)
  })
})

describe("Intent Targeting Boost", () => {
  it("should return 0 for empty query", () => {
    const service = createTestService({ synthetic_queries: ["help with rent"] })
    const result = getIntentTargetingBoost(service, "")
    expect(result.boost).toBe(0)
  })

  it("should return exact match bonus for substring match", () => {
    const service = createTestService({ 
      synthetic_queries: ["help with rent", "housing assistance"] 
    })
    const result = getIntentTargetingBoost(service, "help with rent")
    expect(result.boost).toBe(WEIGHTS.intentExactMatch)
    expect(result.reasons).toContain(`Exact Intent Match (+${WEIGHTS.intentExactMatch})`)
  })

  it("should return high overlap bonus for 75%+ token match", () => {
    const service = createTestService({ 
      synthetic_queries: ["emergency food assistance"] 
    })
    // 3 of 3 tokens match = 100%
    const result = getIntentTargetingBoost(service, "food emergency")
    expect(result.boost).toBeGreaterThanOrEqual(WEIGHTS.intentHighOverlap)
  })

  it("should return 0 for no matching synthetic queries", () => {
    const service = createTestService({ 
      synthetic_queries: ["tax help", "legal aid"] 
    })
    const result = getIntentTargetingBoost(service, "housing rent")
    expect(result.boost).toBe(0)
  })
})

describe("Resource Boost", () => {
  it("should return 0 for no resource indicators", () => {
    const service = createTestService()
    const result = getResourceBoost(service)
    expect(result.boost).toBe(0)
  })

  it("should boost for large staff size", () => {
    const service = createTestService({ 
      resource_indicators: { staff_size: "large" } 
    })
    const result = getResourceBoost(service)
    expect(result.boost).toBe(WEIGHTS.resourceLarge)
  })

  it("should boost cumulatively for multiple indicators", () => {
    const service = createTestService({ 
      resource_indicators: { 
        staff_size: "large",
        annual_budget: "large",
        service_area_size: "national"
      } 
    })
    const result = getResourceBoost(service)
    expect(result.boost).toBe(WEIGHTS.resourceLarge * 3)
  })
})

describe("Proximity Multiplier", () => {
  it("should return 1.0 for virtual services", () => {
    const multiplier = getProximityMultiplier(100, true, false)
    expect(multiplier).toBe(PROXIMITY_CONFIG.virtualMultiplier)
    expect(multiplier).toBe(1.0)
  })

  it("should return 1.0 for 0 distance", () => {
    const multiplier = getProximityMultiplier(0, false, false)
    expect(multiplier).toBe(1.0)
  })

  it("should return 0.5 for standard decay at 50km", () => {
    const multiplier = getProximityMultiplier(50, false, false)
    // k = 0.02, at 50km: 1 / (1 + 0.02 * 50) = 1/2 = 0.5
    expect(multiplier).toBeCloseTo(0.5, 2)
  })

  it("should use reduced decay for wide-area services", () => {
    const standardDecay = getProximityMultiplier(100, false, false)
    const wideAreaDecay = getProximityMultiplier(100, false, true)
    // Wide area should have higher multiplier at same distance
    expect(wideAreaDecay).toBeGreaterThan(standardDecay)
  })

  it("should return higher multiplier for closer services", () => {
    const close = getProximityMultiplier(5, false, false)
    const far = getProximityMultiplier(50, false, false)
    expect(close).toBeGreaterThan(far)
  })
})
