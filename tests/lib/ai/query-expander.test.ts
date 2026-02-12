import { describe, it, expect, beforeEach, vi } from "vitest"
import { expandQuery, clearExpansionCache } from "@/lib/ai/query-expander"

// Mock the AI engine
vi.mock("@/lib/ai/engine", () => ({
  aiEngine: {
    isReady: true,
    chat: vi.fn(),
  },
}))

// Import after mock
import { aiEngine } from "@/lib/ai/engine"

describe("Query Expander", () => {
  beforeEach(() => {
    // Clear cache and reset mocks before each test
    clearExpansionCache()
    vi.clearAllMocks()
  })

  describe("expandQuery", () => {
    it("should return empty expanded array when AI engine not ready", async () => {
      vi.mocked(aiEngine).isReady = false

      const result = await expandQuery("food bank")

      expect(result.original).toBe("food bank")
      expect(result.expanded).toEqual([])
      expect(result.fromCache).toBe(false)
      expect(aiEngine.chat).not.toHaveBeenCalled()
    })

    it("should return empty expanded array for very short queries (<3 chars)", async () => {
      vi.mocked(aiEngine).isReady = true

      const result = await expandQuery("ab")

      expect(result.original).toBe("ab")
      expect(result.expanded).toEqual([])
      expect(result.fromCache).toBe(false)
      expect(aiEngine.chat).not.toHaveBeenCalled()
    })

    it("should expand query with valid JSON response", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(
        JSON.stringify(["food pantry", "meal program", "groceries", "hunger relief"])
      )

      const result = await expandQuery("food bank")

      expect(result.original).toBe("food bank")
      expect(result.expanded).toEqual(["food pantry", "meal program", "groceries", "hunger relief"])
      expect(result.fromCache).toBe(false)
      expect(aiEngine.chat).toHaveBeenCalledWith([
        {
          role: "user",
          content: expect.stringContaining("food bank"),
        },
      ])
    })

    it("should extract JSON from markdown-wrapped response", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(
        'Here are related terms:\n```json\n["shelter", "housing", "homeless support"]\n```'
      )

      const result = await expandQuery("housing")

      expect(result.expanded).toEqual(["shelter", "housing", "homeless support"])
      expect(result.fromCache).toBe(false)
    })

    it("should extract JSON from text with surrounding content", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(
        'Sure! ["legal aid", "lawyer", "court help", "justice"] is what I found.'
      )

      const result = await expandQuery("legal help")

      expect(result.expanded).toEqual(["legal aid", "lawyer", "court help", "justice"])
    })

    it("should sanitize results to max 5 items", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(
        JSON.stringify(["term1", "term2", "term3", "term4", "term5", "term6", "term7"])
      )

      const result = await expandQuery("query")

      expect(result.expanded).toHaveLength(5)
      expect(result.expanded).toEqual(["term1", "term2", "term3", "term4", "term5"])
    })

    it("should remove duplicate terms", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["food", "food", "meal", "food", "groceries"]))

      const result = await expandQuery("food")

      expect(result.expanded).toEqual(["food", "meal", "groceries"])
      expect(result.expanded).toHaveLength(3)
    })

    it("should filter out empty strings", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["term1", "", "term2", "", "term3"]))

      const result = await expandQuery("query")

      expect(result.expanded).toEqual(["term1", "term2", "term3"])
    })

    it("should handle non-array JSON response gracefully", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify({ terms: ["term1", "term2"] }))

      const result = await expandQuery("query")

      // Should extract array from object response using fallback regex
      expect(result.expanded).toEqual(["term1", "term2"])
    })

    it("should handle unparseable response gracefully", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue("This is not valid JSON at all")

      const result = await expandQuery("query")

      expect(result.expanded).toEqual([])
      expect(result.fromCache).toBe(false)
    })

    it("should handle AI engine errors gracefully", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockRejectedValue(new Error("AI engine failure"))

      // Spy on console.warn to verify error logging
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const result = await expandQuery("query")

      expect(result.original).toBe("query")
      expect(result.expanded).toEqual([])
      expect(result.fromCache).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalledWith("[QueryExpander] Failed to expand query:", expect.any(Error))

      consoleWarnSpy.mockRestore()
    })

    it("should normalize queries (lowercase and trim)", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["term1", "term2"]))

      await expandQuery("  FOOD BANK  ")

      // Cache should use normalized query
      const cachedResult = await expandQuery("food bank")
      expect(cachedResult.fromCache).toBe(true)
      expect(cachedResult.expanded).toEqual(["term1", "term2"])
    })

    it("should return cached results on subsequent calls", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["cached1", "cached2", "cached3"]))

      // First call
      const result1 = await expandQuery("test query")
      expect(result1.fromCache).toBe(false)
      expect(aiEngine.chat).toHaveBeenCalledTimes(1)

      // Second call (should use cache)
      const result2 = await expandQuery("test query")
      expect(result2.fromCache).toBe(true)
      expect(result2.expanded).toEqual(["cached1", "cached2", "cached3"])
      expect(aiEngine.chat).toHaveBeenCalledTimes(1) // Still only 1 call
    })

    it("should use cache for normalized queries regardless of case/whitespace", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["term1"]))

      await expandQuery("Housing Help")
      const result = await expandQuery("  housing help  ")

      expect(result.fromCache).toBe(true)
      expect(aiEngine.chat).toHaveBeenCalledTimes(1)
    })

    it("should send correct prompt to AI engine", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["term1"]))

      await expandQuery("disability support")

      expect(aiEngine.chat).toHaveBeenCalledWith([
        {
          role: "user",
          content: expect.stringContaining("disability support"),
        },
      ])

      const callContent = vi.mocked(aiEngine.chat).mock.calls[0]![0]![0]!.content
      expect(callContent).toContain("social services search assistant")
      expect(callContent).toContain("Kingston, Ontario")
      expect(callContent).toContain("JSON array of strings")
      expect(callContent).toContain("ODSP")
      expect(callContent).toContain("OW")
    })
  })

  describe("clearExpansionCache", () => {
    it("should clear the cache", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["term1", "term2"]))

      // Populate cache
      const result1 = await expandQuery("test")
      expect(result1.fromCache).toBe(false)

      // Verify cache is used
      const result2 = await expandQuery("test")
      expect(result2.fromCache).toBe(true)

      // Clear cache
      clearExpansionCache()

      // Should not use cache after clearing
      const result3 = await expandQuery("test")
      expect(result3.fromCache).toBe(false)
      expect(aiEngine.chat).toHaveBeenCalledTimes(2) // Called twice, not using cache
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty query string", async () => {
      vi.mocked(aiEngine).isReady = true

      const result = await expandQuery("")

      expect(result.original).toBe("")
      expect(result.expanded).toEqual([])
      expect(result.fromCache).toBe(false)
      expect(aiEngine.chat).not.toHaveBeenCalled()
    })

    it("should handle query with only whitespace", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["term1", "term2"]))

      const result = await expandQuery("   ")

      // Query "   " has length 3, so it passes the length check
      // After normalization (trim), cache key becomes ""
      expect(result.original).toBe("   ")
      expect(result.expanded).toEqual(["term1", "term2"])
      expect(result.fromCache).toBe(false)
      expect(aiEngine.chat).toHaveBeenCalled()
    })

    it("should handle exactly 3 character query", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["term1"]))

      const result = await expandQuery("abc")

      expect(result.original).toBe("abc")
      expect(result.expanded).toEqual(["term1"])
      expect(aiEngine.chat).toHaveBeenCalled()
    })

    it("should handle special characters in query", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["term1"]))

      const result = await expandQuery("crisis & mental health")

      expect(result.original).toBe("crisis & mental health")
      expect(aiEngine.chat).toHaveBeenCalledWith([
        {
          role: "user",
          content: expect.stringContaining("crisis & mental health"),
        },
      ])
    })

    it("should handle unicode characters in query", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["résultat français"]))

      const result = await expandQuery("aide française")

      expect(result.original).toBe("aide française")
      expect(result.expanded).toEqual(["résultat français"])
    })

    it("should handle very long response arrays", async () => {
      vi.mocked(aiEngine).isReady = true
      const longArray = Array.from({ length: 100 }, (_, i) => `term${i}`)
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(longArray))

      const result = await expandQuery("query")

      expect(result.expanded).toHaveLength(5) // Max 5 enforced
    })

    it("should handle response with null values", async () => {
      vi.mocked(aiEngine).isReady = true
      vi.mocked(aiEngine.chat).mockResolvedValue(JSON.stringify(["term1", null, "term2", null, "term3"]))

      const result = await expandQuery("query")

      expect(result.expanded).toEqual(["term1", "term2", "term3"])
    })
  })
})
