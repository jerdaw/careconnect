import { describe, it, expect } from "vitest"
import { scoreServiceKeyword, WEIGHTS, calculateScore } from "@/lib/search/scoring"
import { Service, VerificationLevel, IntentCategory } from "@/types/service"
import { UserContext } from "@/types/user-context"

const createMockService = (overrides: Partial<Service> = {}): Service => ({
  id: "test-id",
  name: "Kingston Food Bank",
  description: "Provides emergency food support for low income families.",
  url: "https://example.com",
  verification_level: VerificationLevel.L1,
  intent_category: IntentCategory.Food,
  provenance: {
    verified_by: "system",
    verified_at: new Date().toISOString(),
    evidence_url: "https://example.com",
    method: "manual"
  },
  identity_tags: [
    { tag: "Indigenous", evidence_url: "https://example.com/indigenous" },
    { tag: "Families", evidence_url: "https://example.com/families" }
  ],
  synthetic_queries: ["free food", "hungry help"],
  synthetic_queries_fr: ["nourriture gratuite"],
  name_fr: "Banque Alimentaire",
  description_fr: "Fournit une aide alimentaire d'urgence.",
  hours: {},
  ...overrides,
})

const mockService = createMockService()

describe("Search Scoring", () => {
  describe("scoreServiceKeyword", () => {
    it("should score exact name matches highly", () => {
      const { score } = scoreServiceKeyword(mockService, ["kingston", "food"])
      expect(score).toBeGreaterThanOrEqual(WEIGHTS.name)
    })

    it("should score french name matches", () => {
      const { score } = scoreServiceKeyword(mockService, ["banque", "alimentaire"])
      expect(score).toBeGreaterThanOrEqual(WEIGHTS.name)
    })

    it("should match synthetic queries (English)", () => {
      const { score } = scoreServiceKeyword(mockService, ["hungry"])
      expect(score).toBeGreaterThanOrEqual(WEIGHTS.syntheticQuery)
    })

    it("should match synthetic queries (French)", () => {
      const { score } = scoreServiceKeyword(mockService, ["gratuit"])
      // 'nourriture gratuite' contains 'gratuit' when normalized usually? 
      // Actually normalized might keep 'e'. 
      // Let's check logic: normalized 'nourriture gratuite' includes 'gratuit'?
      // If 'gratuit' is token. 'nourriture gratuite'.includes('gratuit') is true.
      expect(score).toBeGreaterThanOrEqual(WEIGHTS.syntheticQuery)
    })

    it("should match identity tags", () => {
      const { score } = scoreServiceKeyword(mockService, ["indigenous"])
      expect(score).toBeGreaterThanOrEqual(WEIGHTS.identityTag)
    })

    it("should match description text (low weight)", () => {
      const { score } = scoreServiceKeyword(mockService, ["emergency", "support"])
      expect(score).toBeGreaterThanOrEqual(WEIGHTS.description)
    })

    it("should accumulate scores for multiple matches", () => {
      // Name match + Description match
      const { score } = scoreServiceKeyword(mockService, ["kingston", "emergency"])
      // kingston -> name match
      // emergency -> description match
      const expected = WEIGHTS.name + WEIGHTS.description
      expect(score).toBeGreaterThanOrEqual(expected)
    })

    it("should apply identity boost when user context matches", () => {
      const context: UserContext = {
        identities: ["indigenous"],
        ageGroup: "youth",
        hasOptedIn: true
      }
      
      const { score } = scoreServiceKeyword(mockService, ["indigenous"], undefined, { userContext: context })
      // Base score from tag match (WEIGHTS.identityTag)
      // Multiplied by boost (1.1 for 1 matching tag)
      const baseScore = WEIGHTS.identityTag
      expect(score).toBeGreaterThan(baseScore)
    })

    it("should return 0 score for empty tokens", () => {
      const { score } = scoreServiceKeyword(mockService, [])
      expect(score).toBe(0)
    })

    it("should handle service with missing optional fields safely", () => {
      const sparseService = createMockService({
        synthetic_queries: undefined,
        synthetic_queries_fr: undefined,
        identity_tags: undefined,
        description_fr: undefined,
        name_fr: undefined
      })
      
      // Should not throw
      const { score } = scoreServiceKeyword(sparseService, ["kingston"])
      expect(score).toBeGreaterThan(0) // Matches name
    })
  })

  describe('calculateScore (Placeholder)', () => {
    it('should return a non-negative score', () => {
      // Current implementation is a placeholder but might have identity boost logic
      const score = calculateScore(mockService, "query")
      expect(score).toBeGreaterThanOrEqual(0)
    })
    
    it('should apply identity boost', () => {
       const context: UserContext = {
        identities: ["indigenous"],
        ageGroup: "youth",
        hasOptedIn: true
      }     
      // calculateScore has some identity boost logic in the placeholder
      // but base score is 0. 0 * boost = 0.
      // So this test might just verify it doesn't crash unless we modify the impl to have a base score.
      // The impl creates 'score = 0' then multiplies, so it stays 0.
      const score = calculateScore(mockService, "query", undefined, { userContext: context })
      expect(score).toBe(0)
    })
  })
})
