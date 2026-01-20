import { describe, it, expect, vi, beforeEach } from "vitest"
import { getSearchMode, serverSearch } from "@/lib/search/search-mode"

describe("Search Mode Utilities", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  describe("getSearchMode", () => {
    it("defaults to local", () => {
      delete process.env.NEXT_PUBLIC_SEARCH_MODE
      expect(getSearchMode()).toBe("local")
    })

    it("returns server if configured", () => {
      process.env.NEXT_PUBLIC_SEARCH_MODE = "server"
      expect(getSearchMode()).toBe("server")
    })
  })

  describe("serverSearch", () => {
    it("fetches results from API", async () => {
      const mockServices = [{ id: "1", name: "Service 1", category: "food" }]
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockServices }),
      })

      const results = await serverSearch({
        query: "test",
        locale: "en",
        options: { limit: 20, offset: 0 },
        filters: {},
      })
      expect(results).toHaveLength(1)
      expect(results[0]!.id).toBe("1")
      expect(results[0]!.intent_category).toBe("food") // Mapped from 'category'
    })

    it("throws error on fetch failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
      })

      await expect(
        serverSearch({
          query: "test",
          locale: "en",
          options: { limit: 20, offset: 0 },
          filters: {},
        })
      ).rejects.toThrow("Server search failed")
    })
  })
})
