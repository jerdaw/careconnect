import { renderHook, waitFor } from "@testing-library/react"
import { useServices } from "@/hooks/useServices"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SearchResult } from "@/lib/search"

// Mock dependencies
vi.mock("@/lib/search", () => ({
    searchServices: vi.fn(async (query, options) => {
        if (query === "fod" && options?.onSuggestion) {
            options.onSuggestion("Food Bank")
        }
        return []
    })
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
    })

    it("calls analytics endpoint", async () => {
        renderHook(() => useServices({ ...defaultProps, query: "food" }))
        vi.advanceTimersByTime(200)
        await vi.runAllTimersAsync()

        expect(global.fetch).toHaveBeenCalledWith("/api/v1/analytics/search", expect.any(Object))
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

        renderHook(() => useServices({
            ...defaultProps,
            query: "complex query",
            isReady: true
        }))
        vi.advanceTimersByTime(200)
        await vi.runAllTimersAsync()

        // First call is keyword only
        // Second call should have vector override
        expect(searchServices).toHaveBeenLastCalledWith("complex query", expect.objectContaining({
            vectorOverride: mockEmbedding
        }))
    })
})
