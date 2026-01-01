import { describe, it, expect } from "vitest"
import { levenshtein, findClosestMatch } from "@/lib/search/levenshtein"

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("food", "food")).toBe(0)
  })
  
  it("returns correct distance for substitution", () => {
    expect(levenshtein("food", "foot")).toBe(1)
  })
  
  it("returns correct distance for insertion", () => {
    expect(levenshtein("food", "foods")).toBe(1)
  })
})

describe("findClosestMatch", () => {
  const candidates = ["Food Bank", "Housing Help", "Mental Health"]
  
  it("finds close match within threshold", () => {
    expect(findClosestMatch("fod bank", candidates)).toBe("Food Bank")
  })
  
  it("returns null for no close match", () => {
    expect(findClosestMatch("xyz123", candidates)).toBeNull()
  })
})
