import { describe, it, expect, vi, beforeEach } from "vitest"
import { initializeVectorStore } from "@/lib/search/lifecycle"
import { loadServices } from "@/lib/search/data"
import { vectorCache } from "@/lib/ai/vector-cache"

vi.mock("@/lib/search/data", () => ({
  loadServices: vi.fn(),
}))

vi.mock("@/lib/ai/vector-cache", () => ({
  vectorCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

describe("Search Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("initializes vector store by fetching and caching vectors", async () => {
    const mockServices = [
      { id: "1", embedding: [0.1], intent_category: "food" },
      { id: "2", embedding: [0.2], intent_category: "housing", coordinates: { lat: 1, lng: 2 } },
    ]
    ;(loadServices as any).mockResolvedValue(mockServices)
    ;(vectorCache.get as any).mockResolvedValue(null) // Not cached yet

    await initializeVectorStore()

    expect(loadServices).toHaveBeenCalled()
    expect(vectorCache.set).toHaveBeenCalledTimes(2)
    expect(vectorCache.set).toHaveBeenCalledWith("1", [0.1], expect.objectContaining({ category: "food" }))
    expect(vectorCache.set).toHaveBeenCalledWith("2", [0.2], expect.objectContaining({ lat: 1, lng: 2 }))
  })

  it("skips caching if vector already exists", async () => {
    const mockServices = [{ id: "1", embedding: [0.1] }]
    ;(loadServices as any).mockResolvedValue(mockServices)
    ;(vectorCache.get as any).mockResolvedValue([0.1]) // Already cached

    await initializeVectorStore()

    expect(vectorCache.set).not.toHaveBeenCalled()
  })

  it("handles services without embeddings", async () => {
    const mockServices = [{ id: "1" }] // No embedding
    ;(loadServices as any).mockResolvedValue(mockServices)

    await initializeVectorStore()

    expect(vectorCache.get).not.toHaveBeenCalled()
  })
})
