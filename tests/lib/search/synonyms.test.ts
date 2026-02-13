import { describe, it, expect } from "vitest"
import { expandQuery, SYNONYMS } from "@/lib/search/synonyms"

describe("Synonyms - Query Expansion", () => {
  describe("expandQuery", () => {
    it("should preserve original tokens", () => {
      const tokens = ["food", "help"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("food")
      expect(expanded).toContain("help")
    })

    it("should expand food-related tokens", () => {
      const tokens = ["food"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("food")
      expect(expanded).toContain("hungry")
      expect(expanded).toContain("meal")
      expect(expanded).toContain("groceries")
      expect(expanded).toContain("nourriture")
    })

    it("should expand housing-related tokens", () => {
      const tokens = ["housing"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("housing")
      expect(expanded).toContain("shelter")
      expect(expanded).toContain("homeless")
      expect(expanded).toContain("logement")
    })

    it("should expand new unhoused synonym group", () => {
      const tokens = ["unhoused"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("unhoused")
      expect(expanded).toContain("homeless")
      expect(expanded).toContain("shelter")
      expect(expanded).toContain("street")
      expect(expanded).toContain("rough sleeping")
      expect(expanded).toContain("sans-abri")
    })

    it("should expand new eviction synonym group", () => {
      const tokens = ["eviction"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("eviction")
      expect(expanded).toContain("evicted")
      expect(expanded).toContain("landlord")
      expect(expanded).toContain("tenant rights")
      expect(expanded).toContain("housing tribunal")
      expect(expanded).toContain("expulsion")
    })

    it("should expand new cerb/ei synonym groups", () => {
      const tokens = ["cerb", "ei"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("cerb")
      expect(expanded).toContain("ei")
      expect(expanded).toContain("employment insurance")
      expect(expanded).toContain("income support")
      expect(expanded).toContain("benefits")
      expect(expanded).toContain("assurance-emploi")
    })

    it("should expand new tax synonym group", () => {
      const tokens = ["tax"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("tax")
      expect(expanded).toContain("income tax")
      expect(expanded).toContain("tax clinic")
      expect(expanded).toContain("free tax")
      expect(expanded).toContain("impôts")
    })

    it("should expand new id synonym group", () => {
      const tokens = ["id"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("id")
      expect(expanded).toContain("identification")
      expect(expanded).toContain("birth certificate")
      expect(expanded).toContain("ohip")
      expect(expanded).toContain("health card")
      expect(expanded).toContain("sin card")
    })

    it("should expand new transportation synonym group", () => {
      const tokens = ["transportation"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("transportation")
      expect(expanded).toContain("bus")
      expect(expanded).toContain("transit")
      expect(expanded).toContain("ride")
      expect(expanded).toContain("accessible transit")
      expect(expanded).toContain("transport")
    })

    it("should expand new childcare synonym group", () => {
      const tokens = ["childcare"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("childcare")
      expect(expanded).toContain("daycare")
      expect(expanded).toContain("babysitting")
      expect(expanded).toContain("child care")
      expect(expanded).toContain("garderie")
    })

    it("should expand new clothing synonym group", () => {
      const tokens = ["clothing"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("clothing")
      expect(expanded).toContain("clothes")
      expect(expanded).toContain("winter coat")
      expect(expanded).toContain("donation")
      expect(expanded).toContain("vêtements")
    })

    it("should expand new home care synonym group", () => {
      const tokens = ["home care"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("home care")
      expect(expanded).toContain("caregiver")
      expect(expanded).toContain("personal support worker")
      expect(expanded).toContain("psw")
      expect(expanded).toContain("soins à domicile")
    })

    it("should expand new assisted living synonym group", () => {
      const tokens = ["assisted living"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("assisted living")
      expect(expanded).toContain("nursing home")
      expect(expanded).toContain("long-term care")
      expect(expanded).toContain("retirement home")
      expect(expanded).toContain("résidence")
    })

    it("should expand new free synonym group", () => {
      const tokens = ["free"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("free")
      expect(expanded).toContain("no cost")
      expect(expanded).toContain("no charge")
      expect(expanded).toContain("gratuit")
      expect(expanded).toContain("charitable")
    })

    it("should expand new appointment synonym group", () => {
      const tokens = ["appointment"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("appointment")
      expect(expanded).toContain("book")
      expect(expanded).toContain("schedule")
      expect(expanded).toContain("walk-in")
      expect(expanded).toContain("rendez-vous")
    })

    it("should expand new interpreter synonym group", () => {
      const tokens = ["interpreter"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("interpreter")
      expect(expanded).toContain("translation")
      expect(expanded).toContain("language help")
      expect(expanded).toContain("interprète")
    })

    it("should expand crisis-related tokens", () => {
      const tokens = ["crisis"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("crisis")
      expect(expanded).toContain("emergency")
      expect(expanded).toContain("suicide")
      expect(expanded).toContain("urgence")
    })

    it("should be case insensitive", () => {
      const tokens = ["FOOD"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("food")
      expect(expanded).toContain("hungry")
      expect(expanded).toContain("meal")
    })

    it("should handle multiple tokens with overlap", () => {
      const tokens = ["food", "hungry"]
      const expanded = expandQuery(tokens)
      // Both expand to similar terms, but Set should deduplicate
      expect(expanded).toContain("food")
      expect(expanded).toContain("hungry")
      expect(expanded).toContain("meal")
      // Should not have duplicates
      const foodCount = expanded.filter((t) => t === "food").length
      expect(foodCount).toBe(1)
    })

    it("should handle unknown tokens gracefully", () => {
      const tokens = ["xyzzy", "unknown"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("xyzzy")
      expect(expanded).toContain("unknown")
      expect(expanded).toHaveLength(2)
    })

    it("should handle empty array", () => {
      const tokens: string[] = []
      const expanded = expandQuery(tokens)
      expect(expanded).toEqual([])
    })

    it("should handle mixed known and unknown tokens", () => {
      const tokens = ["food", "xyz", "housing"]
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("food")
      expect(expanded).toContain("xyz")
      expect(expanded).toContain("housing")
      expect(expanded).toContain("hungry")
      expect(expanded).toContain("shelter")
    })

    it("should expand bilingual terms (French)", () => {
      const tokens = ["logement"]
      const expanded = expandQuery(tokens)
      // logement is in housing's synonym list, but not a key itself
      // So it won't expand further (exact match only)
      expect(expanded).toContain("logement")
    })

    it("should handle multi-word synonym keys", () => {
      const tokens = ["home", "care"]
      // These are separate tokens, not "home care"
      const expanded = expandQuery(tokens)
      expect(expanded).toContain("home")
      expect(expanded).toContain("care")
      // Won't match "home care" since we're doing exact token matching
    })
  })

  describe("SYNONYMS dictionary", () => {
    it("should contain key service categories", () => {
      expect(SYNONYMS.food).toBeDefined()
      expect(SYNONYMS.housing).toBeDefined()
      expect(SYNONYMS.health).toBeDefined()
      expect(SYNONYMS.crisis).toBeDefined()
      expect(SYNONYMS.legal).toBeDefined()
    })

    it("should contain new Phase 1C additions", () => {
      expect(SYNONYMS.unhoused).toBeDefined()
      expect(SYNONYMS.eviction).toBeDefined()
      expect(SYNONYMS.cerb).toBeDefined()
      expect(SYNONYMS.ei).toBeDefined()
      expect(SYNONYMS.tax).toBeDefined()
      expect(SYNONYMS.id).toBeDefined()
      expect(SYNONYMS.transportation).toBeDefined()
      expect(SYNONYMS.childcare).toBeDefined()
      expect(SYNONYMS.clothing).toBeDefined()
      expect(SYNONYMS["home care"]).toBeDefined()
      expect(SYNONYMS["assisted living"]).toBeDefined()
      expect(SYNONYMS.free).toBeDefined()
      expect(SYNONYMS.appointment).toBeDefined()
      expect(SYNONYMS.interpreter).toBeDefined()
    })

    it("should have bilingual support in key categories", () => {
      expect(SYNONYMS.food).toContain("nourriture")
      expect(SYNONYMS.housing).toContain("logement")
      expect(SYNONYMS.health).toContain("santé")
      expect(SYNONYMS.crisis).toContain("urgence")
    })

    it("should have non-empty synonym arrays", () => {
      Object.entries(SYNONYMS).forEach(([_key, synonyms]) => {
        expect(synonyms.length).toBeGreaterThan(0)
      })
    })
  })
})
