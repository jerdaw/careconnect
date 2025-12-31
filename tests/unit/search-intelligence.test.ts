import { describe, it, expect } from "vitest"
import { expandQuery } from "@/lib/search/synonyms"
import { detectQueryPattern } from "@/lib/analytics/zero-results"
import { getSuggestion } from "@/lib/search/fuzzy"

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
