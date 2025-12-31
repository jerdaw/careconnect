import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useHighContrast } from "@/hooks/useHighContrast"

describe("useHighContrast", () => {
    beforeEach(() => {
        // Mock localStorage
        const store: Record<string, string> = {}
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => store[key] || null,
            setItem: (key: string, value: string) => (store[key] = value),
            clear: () => {
                for (const key in store) delete store[key]
            },
        })

        // Clear document classes
        document.documentElement.classList.remove("high-contrast")
        vi.clearAllMocks()
    })

    it("should initialize with false if nothing in localStorage", () => {
        const { result } = renderHook(() => useHighContrast())
        expect(result.current.isHighContrast).toBe(false)
        expect(document.documentElement.classList.contains("high-contrast")).toBe(false)
    })

    it("should initialize with true if localStorage has true", () => {
        localStorage.setItem("kcc-high-contrast", "true")
        const { result } = renderHook(() => useHighContrast())
        expect(result.current.isHighContrast).toBe(true)
        expect(document.documentElement.classList.contains("high-contrast")).toBe(true)
    })

    it("should toggle high contrast mode", () => {
        const { result } = renderHook(() => useHighContrast())

        act(() => {
            result.current.toggleHighContrast()
        })

        expect(result.current.isHighContrast).toBe(true)
        expect(localStorage.getItem("kcc-high-contrast")).toBe("true")
        expect(document.documentElement.classList.contains("high-contrast")).toBe(true)

        act(() => {
            result.current.toggleHighContrast()
        })

        expect(result.current.isHighContrast).toBe(false)
        expect(localStorage.getItem("kcc-high-contrast")).toBe("false")
        expect(document.documentElement.classList.contains("high-contrast")).toBe(false)
    })
})
