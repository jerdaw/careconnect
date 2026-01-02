import { describe, it, expect } from "vitest"
import {
  getVerificationMultiplier,
  getFreshnessMultiplier,
  scoreServiceKeyword,
  WEIGHTS,
} from "@/lib/search/scoring"
import { VerificationLevel } from "@/types/service"

describe("getVerificationMultiplier", () => {
  it("returns 1.2 for L3 verification", () => {
    expect(getVerificationMultiplier(VerificationLevel.L3)).toBe(WEIGHTS.verificationL3)
  })

  it("returns 1.1 for L2 verification", () => {
    expect(getVerificationMultiplier(VerificationLevel.L2)).toBe(WEIGHTS.verificationL2)
  })

  it("returns 1.0 for L1 verification", () => {
    expect(getVerificationMultiplier(VerificationLevel.L1)).toBe(WEIGHTS.verificationL1)
  })

  it("returns 1.0 for L0 verification", () => {
    expect(getVerificationMultiplier(VerificationLevel.L0)).toBe(WEIGHTS.verificationL1)
  })
})

describe("getFreshnessMultiplier", () => {
  it("returns 1.1 for services verified within 30 days", () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 15)
    expect(getFreshnessMultiplier(recentDate.toISOString())).toBe(WEIGHTS.freshnessRecent)
  })

  it("returns 1.0 for services verified 30-90 days ago", () => {
    const normalDate = new Date()
    normalDate.setDate(normalDate.getDate() - 60)
    expect(getFreshnessMultiplier(normalDate.toISOString())).toBe(WEIGHTS.freshnessNormal)
  })

  it("returns 0.9 for services verified over 90 days ago", () => {
    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - 120)
    expect(getFreshnessMultiplier(staleDate.toISOString())).toBe(WEIGHTS.freshnessStale)
  })

  it("returns 0.9 for undefined verification date", () => {
    expect(getFreshnessMultiplier(undefined)).toBe(WEIGHTS.freshnessStale)
  })
})

describe("scoreServiceKeyword with boosts", () => {
  const baseService = {
    id: "test-service",
    name: "Test Food Bank",
    name_fr: "Banque alimentaire test",
    description: "Provides food assistance",
    description_fr: "Fournit une aide alimentaire",
    url: "https://example.com",
    verification_level: VerificationLevel.L1,
    intent_category: "Food",
    provenance: {
      verified_by: "test",
      verified_at: new Date().toISOString(),
      evidence_url: "https://example.com",
      method: "test",
    },
    identity_tags: [],
    synthetic_queries: ["free food", "food bank"],
  } as any // Cast to any to avoid partial mock issues

  it("applies verification boost for L3 services", () => {
    const l1Service = { ...baseService, verification_level: VerificationLevel.L1 }
    const l3Service = { ...baseService, verification_level: VerificationLevel.L3 }

    // Use a token that matches name to ensure base score > 0
    const l1Result = scoreServiceKeyword(l1Service, ["food"])
    const l3Result = scoreServiceKeyword(l3Service, ["food"])

    // L3 score should be higher
    expect(l3Result.score).toBeGreaterThan(l1Result.score)
    // Check for reason string
    expect(l3Result.reasons.some(r => r.includes("Verification Boost"))).toBe(true)
  })

  it("applies freshness boost for recently verified services", () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 7)
    
    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - 120)

    const freshService = {
      ...baseService,
      provenance: { ...baseService.provenance, verified_at: recentDate.toISOString() },
    }
    const staleService = {
      ...baseService,
      provenance: { ...baseService.provenance, verified_at: staleDate.toISOString() },
    }

    const freshResult = scoreServiceKeyword(freshService, ["food"])
    const staleResult = scoreServiceKeyword(staleService, ["food"])

    expect(freshResult.score).toBeGreaterThan(staleResult.score)
    expect(freshResult.reasons.some(r => r.includes("Fresh Data Boost"))).toBe(true)
  })

  it("applies staleness penalty for old services", () => {
    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - 200)

    const staleService = {
      ...baseService,
      provenance: { ...baseService.provenance, verified_at: staleDate.toISOString() },
    }

    const result = scoreServiceKeyword(staleService, ["food"])
    // Expect penalty reason
    expect(result.reasons.some(r => r.includes("Stale Data Penalty"))).toBe(true)
  })
})
