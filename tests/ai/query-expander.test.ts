import { describe, it, expect, vi, beforeEach } from "vitest"
import { expandQuery, clearExpansionCache } from "@/lib/ai/query-expander"
import { aiEngine } from "@/lib/ai/engine"

// Mock the AI engine
vi.mock("@/lib/ai/engine", () => ({
  aiEngine: {
    isReady: false,
    chat: vi.fn(),
  },
}))

describe("Query Expander", () => {
  beforeEach(() => {
    clearExpansionCache()
    vi.clearAllMocks()
  })

  it("returns empty expansion when AI is not ready", async () => {
    const result = await expandQuery("food")
    expect(result.expanded).toEqual([])
    expect(result.fromCache).toBe(false)
  })

  it("returns empty expansion for short queries", async () => {
    ;(aiEngine as any).isReady = true
    const result = await expandQuery("f")
    expect(result.expanded).toEqual([])
  })

  it("parses JSON array response correctly", async () => {
    ;(aiEngine as any).isReady = true
    ;(aiEngine.chat as any).mockResolvedValue('["food bank", "meal program", "grocery"]')

    const result = await expandQuery("hungry")
    expect(result.expanded).toEqual(["food bank", "meal program", "grocery"])
    expect(result.fromCache).toBe(false)
  })

  it("caches results for repeated queries", async () => {
    ;(aiEngine as any).isReady = true
    ;(aiEngine.chat as any).mockResolvedValue('["shelter"]')

    await expandQuery("homeless")
    const result = await expandQuery("homeless")

    expect(result.fromCache).toBe(true)
    expect(aiEngine.chat).toHaveBeenCalledTimes(1)
  })

  it("handles malformed JSON gracefully", async () => {
    ;(aiEngine as any).isReady = true
    ;(aiEngine.chat as any).mockResolvedValue('Here are some terms: ["food bank", "pantry"]')

    const result = await expandQuery("food help")
    expect(result.expanded).toEqual(["food bank", "pantry"])
  })
})
