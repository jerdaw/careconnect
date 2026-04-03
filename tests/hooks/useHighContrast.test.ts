import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useHighContrast } from "@/hooks/useHighContrast"
import { LEGACY_BRAND_KEYS } from "@/lib/legacy-brand"

describe("useHighContrast", () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {}
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => (store[key] = value),
      removeItem: (key: string) => delete store[key],
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
    localStorage.setItem("careconnect-high-contrast", "true")
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
    expect(localStorage.getItem("careconnect-high-contrast")).toBe("true")
    expect(document.documentElement.classList.contains("high-contrast")).toBe(true)

    act(() => {
      result.current.toggleHighContrast()
    })

    expect(result.current.isHighContrast).toBe(false)
    expect(localStorage.getItem("careconnect-high-contrast")).toBe("false")
    expect(document.documentElement.classList.contains("high-contrast")).toBe(false)
  })

  it("migrates the legacy storage key", () => {
    const legacyKey = LEGACY_BRAND_KEYS.highContrast[0]
    localStorage.setItem(legacyKey, "true")

    const { result } = renderHook(() => useHighContrast())

    expect(result.current.isHighContrast).toBe(true)
    expect(localStorage.getItem("careconnect-high-contrast")).toBe("true")
    expect(localStorage.getItem(legacyKey)).toBeNull()
  })
})
