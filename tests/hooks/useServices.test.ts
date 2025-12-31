import { renderHook, waitFor } from "@testing-library/react"
import { useServices } from "@/hooks/useServices"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SearchResult } from "@/lib/search"

// Mock dependencies
vi.mock("@/lib/search", () => ({
    searchServices: vi.fn(),
    getSuggestion: vi.fn(),
}))

import { searchServices, getSuggestion } from "@/lib/search"

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
            ; (global.fetch as any).mockClear()
    })

    it("does nothing with empty query", async () => {
        renderHook(() => useServices({ ...defaultProps, query: "" }))

        // Should clear state
        await waitFor(() => {
            expect(mockSetResults).toHaveBeenCalledWith([])
            expect(mockSetHasSearched).toHaveBeenCalledWith(false)
            expect(mockSetSuggestion).toHaveBeenCalledWith(null)
        })

        expect(searchServices).not.toHaveBeenCalled()
    })

    it("performs search with query", async () => {
        const mockResults: SearchResult[] = [{ service: { id: "1" } as any, score: 10, matchReasons: [] }]
            ; (searchServices as any).mockResolvedValue(mockResults)

        renderHook(() => useServices({ ...defaultProps, query: "food" }))

        await waitFor(() => {
            expect(mockSetIsLoading).toHaveBeenCalledWith(true)
            expect(mockSetHasSearched).toHaveBeenCalledWith(true)
        })

        await waitFor(() => {
            expect(searchServices).toHaveBeenCalledWith("food", expect.objectContaining({ openNow: undefined }))
            expect(mockSetResults).toHaveBeenCalledWith(mockResults)
            expect(mockSetIsLoading).toHaveBeenCalledWith(false)
        })
    })

    it("calls analytics endpoint", async () => {
        ; (searchServices as any).mockResolvedValue([])

        renderHook(() => useServices({ ...defaultProps, query: "food" }))

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/v1/analytics/search", expect.any(Object))
        })
    })

    it("checks for suggestions", async () => {
        ; (searchServices as any).mockResolvedValue([])
            ; (getSuggestion as any).mockReturnValue("Did you mean food?")

        renderHook(() => useServices({ ...defaultProps, query: "fod" }))

        await waitFor(() => {
            expect(mockSetSuggestion).toHaveBeenCalledWith("Did you mean food?")
        })
    })

    it("performs vector search when ready and embedding available", async () => {
        ; (searchServices as any).mockResolvedValue([])
        const mockEmbedding = [0.1, 0.2]
        mockGenerateEmbedding.mockResolvedValue(mockEmbedding)

        renderHook(() => useServices({
            ...defaultProps,
            query: "complex query",
            isReady: true
        }))

        await waitFor(() => {
            // First call is keyword only
            // Second call should have vector override
            expect(searchServices).toHaveBeenLastCalledWith("complex query", expect.objectContaining({
                vectorOverride: mockEmbedding
            }))
        })
    })
})
