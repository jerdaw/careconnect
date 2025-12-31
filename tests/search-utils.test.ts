import { describe, it, expect } from "vitest"
import { detectCrisis, boostCrisisResults } from "@/lib/search/crisis"
import { highlightMatches } from "@/lib/search/highlight"
import { SearchResult } from "@/lib/search/types"
import { Service, VerificationLevel, IntentCategory } from "@/types/service"

describe("Crisis Detection", () => {
  it("should detect crisis keywords", () => {
    expect(detectCrisis("I want to kill myself")).toBe(true)
    expect(detectCrisis("help me die")).toBe(true)
    expect(detectCrisis("suicide help")).toBe(true)
    expect(detectCrisis("I need food")).toBe(false)
    expect(detectCrisis("")).toBe(false)
  })

  it("should boost crisis services", () => {
    const mockServiceC: Service = {
      id: "crisis-s",
      name: "Crisis Line",
      description: "Help",
      url: "",
      verification_level: VerificationLevel.L2,
      intent_category: IntentCategory.Crisis,
      provenance: {} as any,
      identity_tags: [],
      synthetic_queries: [],
    }
    const mockServiceF: Service = {
      id: "food-s",
      name: "Food Bank",
      description: "Food",
      url: "",
      verification_level: VerificationLevel.L2,
      intent_category: IntentCategory.Food,
      provenance: {} as any,
      identity_tags: [],
      synthetic_queries: [],
    }

    const results: SearchResult[] = [
      { service: mockServiceF, score: 50, matchReasons: [] },
      { service: mockServiceC, score: 20, matchReasons: [] },
    ]

    const boosted = boostCrisisResults(results, true)
    expect(boosted[0]?.service.id).toBe("crisis-s")
    expect(boosted[0]?.matchReasons).toContain("Crisis Detected (Safety Boost)")
    expect(boosted[1]?.service.id).toBe("food-s")
  })
})

describe("Match Highlighting", () => {
  it("should highlight matching tokens", () => {
    const text = "The quick brown fox"
    const tokens = ["quick", "fox"]
    const highlighted = highlightMatches(text, tokens)
    expect(highlighted).toContain('<mark class="bg-yellow-200')
    expect(highlighted).toContain(">quick</mark>")
    expect(highlighted).toContain(">fox</mark>")
    expect(highlighted).not.toContain(">brown</mark>")
  })

  it("should be case insensitive", () => {
    const text = "Food Bank"
    const tokens = ["food"]
    const highlighted = highlightMatches(text, tokens)
    expect(highlighted).toContain(">Food</mark>")
  })

  it("should handle special characters safely", () => {
    const text = "C++ Programming"
    const tokens = ["c++"]
    const highlighted = highlightMatches(text, tokens)
    expect(highlighted).toContain(">C++</mark>")
  })
})
