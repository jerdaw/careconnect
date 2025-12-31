import { renderHook, act } from "@testing-library/react"
import { useUserContext } from "@/hooks/useUserContext"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockSetContext = vi.fn()
const mockClearContext = vi.fn()
let mockContextVal = { ageGroup: null, identities: [], hasOptedIn: false }

vi.mock("@/hooks/useLocalStorage", () => ({
    useLocalStorage: () => [mockContextVal, mockSetContext, mockClearContext],
}))

describe("useUserContext Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset mock value
        mockContextVal = { ageGroup: null, identities: [], hasOptedIn: false }

        // Mock setContext to update local variable to simulate state update for some tests if needed,
        // but mostly we check if setContext was called with correct updater
        mockSetContext.mockImplementation((updater) => {
            if (typeof updater === 'function') {
                mockContextVal = updater(mockContextVal)
            } else {
                mockContextVal = updater
            }
        })
    })

    it("initializes default context", () => {
        const { result } = renderHook(() => useUserContext())
        expect(result.current.context).toEqual({ ageGroup: null, identities: [], hasOptedIn: false })
    })

    it("updates age group", () => {
        const { result } = renderHook(() => useUserContext())

        act(() => {
            result.current.updateAgeGroup("youth")
        })

        expect(mockSetContext).toHaveBeenCalled()
        // Verify state update logic if possible, or just call
    })

    it("toggles identity", () => {
        const { result } = renderHook(() => useUserContext())

        act(() => {
            result.current.toggleIdentity("indigenous")
        })

        expect(mockSetContext).toHaveBeenCalled()
    })

    it("handles opt-in and opt-out", () => {
        const { result } = renderHook(() => useUserContext())

        act(() => {
            result.current.optIn()
        })
        expect(mockSetContext).toHaveBeenCalled()

        act(() => {
            result.current.optOut()
        })
        expect(mockClearContext).toHaveBeenCalled()
    })
})
