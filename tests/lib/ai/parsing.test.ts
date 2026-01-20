import { describe, it, expect } from "vitest"
import { sanitizeModelOutput, parseRefinedQuery, parseExpandedQuery } from "@/lib/ai/parsing"

describe("AI Parsing Utilities", () => {
  describe("sanitizeModelOutput", () => {
    it("removes Instruction 2 leak markers", () => {
      const input = "Here is the result.\nInstruction 2: Additional context"
      expect(sanitizeModelOutput(input)).toBe("Here is the result.")
    })

    it("handles complex leak markers", () => {
      const input = "Result text\nInstruction 2 (More difficult with added constraints): Stop here"
      expect(sanitizeModelOutput(input)).toBe("Result text")
    })

    it("returns trimmed text if no markers found", () => {
      const input = "  Clean text  "
      expect(sanitizeModelOutput(input)).toBe("Clean text")
    })
  })

  describe("parseRefinedQuery", () => {
    it("parses valid JSON", () => {
      const input = JSON.stringify({
        query: "new query",
        terms: ["term1", "term2"],
        category: "Food",
      })
      const result = parseRefinedQuery(input, "original")
      expect(result?.query).toBe("new query")
      expect(result?.terms).toEqual(["term1", "term2"])
      expect(result?.category).toBe("Food")
    })

    it("extracts JSON from markdown or text", () => {
      const input = 'Sure! {"query": "extracted"} Hope this helps.'
      const result = parseRefinedQuery(input, "original")
      expect(result?.query).toBe("extracted")
    })

    it("falls back to user query if AI query missing", () => {
      const input = JSON.stringify({ terms: ["term1"] })
      const result = parseRefinedQuery(input, "original")
      expect(result?.query).toBe("original")
    })

    it("returns null on invalid input", () => {
      expect(parseRefinedQuery("not json", "original")).toBeNull()
    })
  })

  describe("parseExpandedQuery", () => {
    it("parses simple array", () => {
      const input = '["a", "b"]'
      expect(parseExpandedQuery(input)).toEqual(["a", "b"])
    })

    it("extracts array from text", () => {
      const input = 'Results: ["a", "b"]'
      expect(parseExpandedQuery(input)).toEqual(["a", "b"])
    })

    it("limits to 5 items and removes duplicates", () => {
      const input = '["a", "a", "b", "c", "d", "e", "f"]'
      const result = parseExpandedQuery(input)
      expect(result).toHaveLength(5)
      expect(result).toContain("a")
      expect(new Set(result).size).toBe(5)
    })
  })
})
