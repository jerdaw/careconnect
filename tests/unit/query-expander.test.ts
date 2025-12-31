import { describe, it, expect, vi, beforeEach } from "vitest"
import { expandQuery, clearExpansionCache } from "../../lib/ai/query-expander"
import { aiEngine } from "../../lib/ai/engine"

// Mock dependencies
vi.mock("../../lib/ai/engine", () => ({
  aiEngine: {
    isReady: false,
    chat: vi.fn(),
  },
}))

describe("Query Expander", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearExpansionCache()
    // Reset default mock state
    Object.defineProperty(aiEngine, "isReady", { get: () => false })
  })

  it("returns original query if AI is not ready", async () => {
    const result = await expandQuery("food")
    expect(result.expanded).toHaveLength(0)
    expect(result.original).toBe("food")
  })

  it("returns original query if query is too short", async () => {
    // Mock AI ready
    Object.defineProperty(aiEngine, "isReady", { get: () => true })

    const result = await expandQuery("hi")
    expect(result.expanded).toHaveLength(0)
  })

  it("expands query when AI is ready", async () => {
    // Mock AI ready
    Object.defineProperty(aiEngine, "isReady", { get: () => true })
    // Mock successful chat response
    ;(aiEngine.chat as any).mockResolvedValue('["meal", "groceries"]')

    const result = await expandQuery("food")

    expect(result.expanded).toEqual(["meal", "groceries"])
    expect(aiEngine.chat).toHaveBeenCalled()
  })

  it("handles invalid JSON from AI gracefully", async () => {
    Object.defineProperty(aiEngine, "isReady", { get: () => true })
    ;(aiEngine.chat as any).mockResolvedValue("Not a JSON array")

    const result = await expandQuery("food")
    expect(result.expanded).toHaveLength(0)
  })

  it("caches results", async () => {
    Object.defineProperty(aiEngine, "isReady", { get: () => true })
    ;(aiEngine.chat as any).mockResolvedValue('["cached"]')

    // First call
    await expandQuery("cache_test")

    // Second call should return cached
    const result = await expandQuery("cache_test")
    expect(result.fromCache).toBe(true)
    expect(aiEngine.chat).toHaveBeenCalledTimes(1)
  })
})
