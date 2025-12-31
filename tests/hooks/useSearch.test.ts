import { renderHook, act } from "@testing-library/react"
import { useSearch } from "@/hooks/useSearch"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock dependencies
const mockSetSavedSearches = vi.fn()
const mockRequestLocation = vi.fn()
const mockClearLocation = vi.fn()

vi.mock("@/hooks/useLocalStorage", () => ({
    useLocalStorage: () => [
        ["saved-term"], // initial saved searches
        mockSetSavedSearches,
    ],
}))

vi.mock("@/hooks/useGeolocation", () => ({
    useGeolocation: () => ({
        coordinates: { lat: 40, lng: -70 },
        isLocating: false,
        error: null,
        requestLocation: mockRequestLocation,
        clearLocation: mockClearLocation,
    }),
}))

vi.mock("@/hooks/useUserContext", () => ({
    useUserContext: () => ({
        context: { identities: [] }
    })
}))

describe("useSearch Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("initializes with default state", () => {
        const { result } = renderHook(() => useSearch())

        expect(result.current.query).toBe("")
        expect(result.current.results).toEqual([])
        expect(result.current.savedSearches).toEqual(["saved-term"])
        expect(result.current.userLocation).toEqual({ lat: 40, lng: -70 })
    })

    it("updates query state", () => {
        const { result } = renderHook(() => useSearch())

        act(() => {
            result.current.setQuery("new query")
        })
        expect(result.current.query).toBe("new query")
    })

    it("manages category state", () => {
        const { result } = renderHook(() => useSearch())

        act(() => {
            result.current.setCategory("Food")
        })
        expect(result.current.category).toBe("Food")
    })

    it("handles toggling location", () => {
        const { result } = renderHook(() => useSearch())

        // Initial state has location mock
        act(() => {
            result.current.toggleLocation()
        })
        expect(mockClearLocation).toHaveBeenCalled()

        // Note: To test the "else" branch (requestLocation), we would need to re-mock 
        // useGeolocation to return null coordinates, or split tests. 
        // For simplicity here we verify the "clear" path which corresponds to initial mock state.
    })

    it("saves search terms", () => {
        const { result } = renderHook(() => useSearch())

        act(() => {
            result.current.setQuery("test-term")
        })

        act(() => {
            result.current.handleSaveSearch()
        })

        expect(mockSetSavedSearches).toHaveBeenCalled()
    })

    it("removes saved search terms", () => {
        const { result } = renderHook(() => useSearch())

        act(() => {
            result.current.removeSavedSearch("saved-term")
        })

        expect(mockSetSavedSearches).toHaveBeenCalled()
    })
})
