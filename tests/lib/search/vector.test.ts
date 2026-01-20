import { describe, it, expect } from "vitest"
import { cosineSimilarity } from "@/lib/search/vector"

describe("Vector Similarity", () => {
  describe("cosineSimilarity", () => {
    it("returns 1.0 for identical vectors", () => {
      const v = [1, 0, 0]
      expect(cosineSimilarity(v, v)).toBeCloseTo(1.0)
    })

    it("returns 0.0 for orthogonal vectors", () => {
      const v1 = [1, 0, 0]
      const v2 = [0, 1, 0]
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(0.0)
    })

    it("returns -1.0 for opposite vectors", () => {
      const v1 = [1, 0, 0]
      const v2 = [-1, 0, 0]
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1.0)
    })

    it("handles different magnitude vectors", () => {
      const v1 = [2, 0, 0]
      const v2 = [0.5, 0, 0]
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0)
    })

    it("handles multidimensional vectors", () => {
      const v1 = [1, 2, 3]
      const v2 = [2, 4, 6]
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0)
    })

    it("returns 0 for zero vectors to avoid NaN", () => {
      const v1 = [0, 0, 0]
      const v2 = [1, 2, 3]
      expect(cosineSimilarity(v1, v2)).toBe(0)
    })
  })
})
