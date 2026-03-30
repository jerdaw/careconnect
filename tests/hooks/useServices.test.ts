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

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}))

vi.mock("@/lib/offline/cache", () => ({
  getCachedServices: vi.fn(),
  setCachedServices: vi.fn(),
}))

import { searchServices } from "@/lib/search"

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

describe("useServices Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    ;(global.fetch as any).mockClear()
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
    vi.advanceTimersByTime(200)
    await vi.runAllTimersAsync()

    expect(mockSetResults).toHaveBeenCalledWith([])
    expect(mockSetHasSearched).toHaveBeenCalledWith(false)
    expect(mockSetSuggestion).toHaveBeenCalledWith(null)
    expect(searchServices).not.toHaveBeenCalled()
  })

  it("performs search with query", async () => {
    const mockResults: SearchResult[] = [{ service: { id: "1" } as any, score: 10, matchReasons: [] }]
    ;(searchServices as any).mockResolvedValue(mockResults)

    renderHook(() => useServices({ ...defaultProps, query: "food" }))
    vi.advanceTimersByTime(200)
    await vi.runAllTimersAsync()

    expect(mockSetIsLoading).toHaveBeenCalledWith(true)
    expect(mockSetHasSearched).toHaveBeenCalledWith(true)
    expect(searchServices).toHaveBeenCalledWith("food", expect.objectContaining({ openNow: undefined }))
    expect(mockSetResults).toHaveBeenCalledWith(mockResults)
    expect(mockSetIsLoading).toHaveBeenCalledWith(false)
    expect(setCachedServices).toHaveBeenCalledWith(mockResults)
  })

  it("calls analytics endpoint", async () => {
    renderHook(() => useServices({ ...defaultProps, query: "food" }))
    vi.advanceTimersByTime(200)
    await vi.runAllTimersAsync()

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/analytics/search", expect.any(Object))

    const analyticsCall = vi.mocked(global.fetch).mock.calls.find(([url]) => url === "/api/v1/analytics/search")
    const requestInit = analyticsCall?.[1] as RequestInit | undefined
    const body = requestInit?.body ? JSON.parse(String(requestInit.body)) : null

    expect(body).toEqual({
      category: undefined,
      hasLocation: false,
      resultCount: 0,
    })
    expect(body).not.toHaveProperty("query")
    expect(body).not.toHaveProperty("mode")
  })

  it("checks for suggestions", async () => {
    // Redefine mock to trigger callback
    ;(searchServices as any).mockImplementation(async (q: string, options: any) => {
      if (options?.onSuggestion) options.onSuggestion("Food Bank")
      return []
    })

    renderHook(() => useServices({ ...defaultProps, query: "fod" }))
    vi.advanceTimersByTime(200)
    await vi.runAllTimersAsync()

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
    vi.advanceTimersByTime(200)
    await vi.runAllTimersAsync()

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
    vi.advanceTimersByTime(200)
    await vi.runAllTimersAsync()

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
    vi.advanceTimersByTime(200)
    await vi.runAllTimersAsync()

    expect(mockSetResults).toHaveBeenCalledWith(cachedResults)
    expect(mockSetHasSearched).toHaveBeenCalledWith(true)
    expect(mockSetIsLoading).toHaveBeenCalledWith(false)
  })

  it("tolerates analytics failures without affecting search results", async () => {
    const mockResults: SearchResult[] = [{ service: { id: "1" } as any, score: 10, matchReasons: [] }]
    ;(searchServices as any).mockResolvedValue(mockResults)
    ;(global.fetch as any).mockRejectedValueOnce(new Error("analytics failed"))

    renderHook(() => useServices({ ...defaultProps, query: "food" }))
    vi.advanceTimersByTime(200)
    await vi.runAllTimersAsync()

    expect(mockSetResults).toHaveBeenCalledWith(mockResults)
    expect(mockSetHasSearched).toHaveBeenCalledWith(true)
  })
})
