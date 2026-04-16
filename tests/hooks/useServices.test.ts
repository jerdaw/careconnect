import { renderHook } from "@testing-library/react"
import { useServices } from "@/hooks/useServices"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SearchResult } from "@/lib/search"
import { getCachedServices, setCachedServices } from "@/lib/offline/cache"

// Mock dependencies
vi.mock("@/lib/search", () => ({
  searchServices: vi.fn(),
}))

vi.mock("@/lib/search/search-mode", () => ({
  getSearchMode: vi.fn(() => "local"),
  serverSearch: vi.fn(),
}))

vi.mock("@/lib/offline/status", () => ({
  isOffline: vi.fn(() => false),
}))

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}))

vi.mock("@/lib/offline/cache", () => ({
  getCachedServices: vi.fn(),
  setCachedServices: vi.fn(),
}))

vi.mock("@/lib/search/client-enhancer", () => ({
  enhanceSearchResults: vi.fn(async ({ isReady, query, generateEmbedding, search }) => {
    if (!isReady) {
      return null
    }

    const embedding = await generateEmbedding(query)
    if (!embedding) {
      return null
    }

    return search(query, { vectorOverride: embedding })
  }),
  filterSearchResultsByScope: vi.fn((results: SearchResult[], scope: string) => {
    if (scope !== "provincial") {
      return results
    }

    return results.filter((result) => result.service.scope === "canada" || result.service.scope === "ontario")
  }),
}))

import { searchServices } from "@/lib/search"
import { getSearchMode, serverSearch } from "@/lib/search/search-mode"

// Mock props
const mockSetResults = vi.fn()
const mockSetIsLoading = vi.fn()
const mockSetHasSearched = vi.fn()
const mockSetSuggestion = vi.fn()
const mockGenerateEmbedding = vi.fn()

const defaultProps = {
  query: "",
  isReady: false,
  generateEmbedding: mockGenerateEmbedding,
  setResults: mockSetResults,
  setIsLoading: mockSetIsLoading,
  setHasSearched: mockSetHasSearched,
  setSuggestion: mockSetSuggestion,
}

const flushSearchEffect = async () => {
  await vi.advanceTimersByTimeAsync(200)
  await Promise.resolve()
  await Promise.resolve()
}

describe("useServices Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.mocked(getSearchMode).mockReturnValue("local")
    vi.mocked(serverSearch).mockResolvedValue([])
    ;(global.fetch as any).mockReset()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    })
    // Default mock for searchServices
    ;(searchServices as any).mockResolvedValue([])
    vi.mocked(getCachedServices).mockReturnValue(null)

    // Setup chain return values to return itself (this)
    const mockChain: Record<string, any> = {}
    mockChain.from = vi.fn(() => mockChain)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("does nothing with empty query", async () => {
    renderHook(() => useServices({ ...defaultProps, query: "" }))
    await flushSearchEffect()

    expect(mockSetResults).toHaveBeenCalledWith([])
    expect(mockSetHasSearched).toHaveBeenCalledWith(false)
    expect(mockSetSuggestion).toHaveBeenCalledWith(null)
    expect(searchServices).not.toHaveBeenCalled()
  })

  it("performs search with query", async () => {
    const mockResults: SearchResult[] = [{ service: { id: "1" } as any, score: 10, matchReasons: [] }]
    ;(searchServices as any).mockResolvedValue(mockResults)

    renderHook(() => useServices({ ...defaultProps, query: "food" }))
    await flushSearchEffect()

    expect(mockSetIsLoading).toHaveBeenCalledWith(true)
    expect(mockSetHasSearched).toHaveBeenLastCalledWith(true)
    expect(searchServices).toHaveBeenCalledWith("food", expect.objectContaining({ openNow: undefined }))
    expect(mockSetResults).toHaveBeenCalledWith(mockResults)
    expect(mockSetIsLoading).toHaveBeenCalledWith(false)
    expect(setCachedServices).toHaveBeenCalledWith(mockResults)
  })

  it("calls analytics endpoint", async () => {
    renderHook(() => useServices({ ...defaultProps, query: "food" }))
    await flushSearchEffect()

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/analytics/search", expect.any(Object))

    const analyticsCall = vi.mocked(global.fetch).mock.calls.find(([url]) => url === "/api/v1/analytics/search")
    const requestInit = analyticsCall?.[1] as RequestInit | undefined
    const body = requestInit?.body ? JSON.parse(String(requestInit.body)) : null

    expect(body).toEqual({
      locale: "en",
      resultCount: 0,
    })
    expect(body).not.toHaveProperty("query")
    expect(body).not.toHaveProperty("mode")
  })

  it("supports open-now-only searches without short-circuiting", async () => {
    renderHook(() => useServices({ ...defaultProps, query: "", openNow: true }))
    await flushSearchEffect()

    expect(searchServices).toHaveBeenCalledWith(
      "",
      expect.objectContaining({
        openNow: true,
      })
    )
    expect(mockSetHasSearched).toHaveBeenLastCalledWith(true)
  })

  it("passes location and open-now filters through to server mode", async () => {
    vi.mocked(getSearchMode).mockReturnValue("server")
    vi.mocked(serverSearch).mockResolvedValue([{ id: "server-1" } as any])

    renderHook(() =>
      useServices({
        ...defaultProps,
        query: "housing",
        category: "Housing",
        openNow: true,
        userLocation: { lat: 44.23, lng: -76.49 },
      })
    )
    await flushSearchEffect()

    expect(serverSearch).toHaveBeenCalledWith({
      query: "housing",
      locale: "en",
      filters: { category: "Housing", openNow: true },
      options: { limit: 50, offset: 0 },
      location: { lat: 44.23, lng: -76.49 },
    })
  })

  it("dedupes identical settled search analytics events", async () => {
    const { rerender } = renderHook((props: typeof defaultProps & { query: string }) => useServices(props), {
      initialProps: { ...defaultProps, query: "food" },
    })
    await flushSearchEffect()

    const analyticsCallsAfterFirstSearch = vi
      .mocked(global.fetch)
      .mock.calls.filter(([url]) => url === "/api/v1/analytics/search").length

    rerender({ ...defaultProps, query: "food" })
    await flushSearchEffect()

    const analyticsCallsAfterSecondSearch = vi
      .mocked(global.fetch)
      .mock.calls.filter(([url]) => url === "/api/v1/analytics/search").length

    expect(analyticsCallsAfterFirstSearch).toBe(1)
    expect(analyticsCallsAfterSecondSearch).toBe(1)
  })

  it("checks for suggestions", async () => {
    // Redefine mock to trigger callback
    ;(searchServices as any).mockImplementation(async (q: string, options: any) => {
      if (options?.onSuggestion) options.onSuggestion("Food Bank")
      return []
    })

    renderHook(() => useServices({ ...defaultProps, query: "fod" }))
    await flushSearchEffect()

    expect(mockSetSuggestion).toHaveBeenCalledWith("Food Bank")
  })

  it("performs vector search when ready and embedding available", async () => {
    const mockEmbedding = [0.1, 0.2]
    mockGenerateEmbedding.mockResolvedValue(mockEmbedding)
    ;(searchServices as any)
      .mockResolvedValueOnce([{ service: { id: "base", scope: "kingston" } as any, score: 10, matchReasons: [] }])
      .mockResolvedValueOnce([{ service: { id: "enhanced", scope: "kingston" } as any, score: 20, matchReasons: [] }])

    renderHook(() =>
      useServices({
        ...defaultProps,
        query: "complex query",
        isReady: true,
      })
    )
    await flushSearchEffect()

    // First call is keyword only
    // Second call should have vector override
    expect(searchServices).toHaveBeenLastCalledWith(
      "complex query",
      expect.objectContaining({
        vectorOverride: mockEmbedding,
      })
    )
    expect(mockSetResults).toHaveBeenLastCalledWith([
      { service: { id: "enhanced", scope: "kingston" } as any, score: 20, matchReasons: [] },
    ])
  })

  it("keeps keyword-only results when semantic embedding is unavailable", async () => {
    const baseResults: SearchResult[] = [
      { service: { id: "base", scope: "kingston" } as any, score: 10, matchReasons: [] },
    ]
    mockGenerateEmbedding.mockResolvedValue(null)
    ;(searchServices as any).mockResolvedValue(baseResults)

    renderHook(() =>
      useServices({
        ...defaultProps,
        query: "complex query",
        isReady: true,
      })
    )
    await flushSearchEffect()

    expect(searchServices).toHaveBeenCalledTimes(1)
    expect(searchServices).toHaveBeenCalledWith(
      "complex query",
      expect.objectContaining({
        category: undefined,
        location: undefined,
        openNow: undefined,
      })
    )
    expect(mockSetResults).toHaveBeenLastCalledWith(baseResults)
  })

  it("applies scope filtering to both initial and enhanced local results", async () => {
    const mockEmbedding = [0.1, 0.2]
    mockGenerateEmbedding.mockResolvedValue(mockEmbedding)
    ;(searchServices as any)
      .mockResolvedValueOnce([
        { service: { id: "kingston", scope: "kingston" } as any, score: 10, matchReasons: [] },
        { service: { id: "canada", scope: "canada" } as any, score: 9, matchReasons: [] },
      ])
      .mockResolvedValueOnce([
        { service: { id: "canada", scope: "canada" } as any, score: 20, matchReasons: [] },
        { service: { id: "ontario", scope: "ontario" } as any, score: 18, matchReasons: [] },
      ])

    renderHook(() =>
      useServices({
        ...defaultProps,
        query: "housing",
        scope: "provincial",
        isReady: true,
      })
    )
    await flushSearchEffect()

    expect(mockSetResults).toHaveBeenNthCalledWith(1, [
      { service: { id: "canada", scope: "canada" } as any, score: 9, matchReasons: [] },
    ])
    expect(mockSetResults).toHaveBeenLastCalledWith([
      { service: { id: "canada", scope: "canada" } as any, score: 20, matchReasons: [] },
      { service: { id: "ontario", scope: "ontario" } as any, score: 18, matchReasons: [] },
    ])
  })

  it("uses cached results after a search failure", async () => {
    const cachedResults: SearchResult[] = [{ service: { id: "cached" } as any, score: 7, matchReasons: [] }]
    ;(searchServices as any).mockRejectedValueOnce(new Error("boom"))
    vi.mocked(getCachedServices).mockReturnValue(cachedResults)

    renderHook(() => useServices({ ...defaultProps, query: "food" }))
    await flushSearchEffect()

    expect(mockSetResults).toHaveBeenCalledWith(cachedResults)
    expect(mockSetHasSearched).toHaveBeenCalledWith(true)
    expect(mockSetIsLoading).toHaveBeenCalledWith(false)
  })

  it("tolerates analytics failures without affecting search results", async () => {
    const mockResults: SearchResult[] = [{ service: { id: "1" } as any, score: 10, matchReasons: [] }]
    ;(searchServices as any).mockResolvedValue(mockResults)
    ;(global.fetch as any).mockRejectedValueOnce(new Error("analytics failed"))

    renderHook(() => useServices({ ...defaultProps, query: "food" }))
    await flushSearchEffect()

    expect(mockSetResults).toHaveBeenCalledWith(mockResults)
    expect(mockSetHasSearched).toHaveBeenLastCalledWith(true)
  })
})
