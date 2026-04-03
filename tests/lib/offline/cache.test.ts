import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCachedServices, setCachedServices } from "@/lib/offline/cache"
import { LEGACY_BRAND_KEYS } from "@/lib/legacy-brand"

describe("Offline Cache", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.useFakeTimers()
  })

  it("should return null if nothing is cached", () => {
    expect(getCachedServices()).toBeNull()
  })

  it("should store and retrieve data", () => {
    const testData = [{ id: "1", name: "Test" }]
    setCachedServices(testData)
    expect(getCachedServices()).toEqual(testData)
  })

  it("should return null if cache is expired", () => {
    const testData = [{ id: "1", name: "Test" }]
    setCachedServices(testData)

    // Advance time by 25 hours (TTL is 24)
    vi.advanceTimersByTime(25 * 60 * 60 * 1000)

    expect(getCachedServices()).toBeNull()
    expect(localStorage.getItem("careconnect-services-cache")).toBeNull()
  })

  it("should return data if within TTL", () => {
    const testData = [{ id: "1", name: "Test" }]
    setCachedServices(testData)

    // Advance time by 23 hours
    vi.advanceTimersByTime(23 * 60 * 60 * 1000)

    expect(getCachedServices()).toEqual(testData)
  })

  it("migrates the legacy cache key", () => {
    const testData = [{ id: "1", name: "Test" }]
    const legacyKey = LEGACY_BRAND_KEYS.servicesCache[0]
    localStorage.setItem(
      legacyKey,
      JSON.stringify({
        data: testData,
        timestamp: Date.now(),
      })
    )

    expect(getCachedServices()).toEqual(testData)
    expect(localStorage.getItem("careconnect-services-cache")).not.toBeNull()
    expect(localStorage.getItem(legacyKey)).toBeNull()
  })
})
