import { renderHook, act } from "@testing-library/react"
import { useGeolocation } from "@/hooks/useGeolocation"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("useGeolocation Hook", () => {
    const mockGetCurrentPosition = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock navigator.geolocation
        Object.defineProperty(global.navigator, "geolocation", {
            writable: true,
            value: {
                getCurrentPosition: mockGetCurrentPosition,
            },
        })
    })

    afterEach(() => {
        // Cleanup if needed
    })

    it("initializes with default state", () => {
        const { result } = renderHook(() => useGeolocation())

        expect(result.current.coordinates).toBeNull()
        expect(result.current.isLocating).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it("updates state when location is requested successfully", () => {
        mockGetCurrentPosition.mockImplementation((success) => {
            success({
                coords: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                },
            })
        })

        const { result } = renderHook(() => useGeolocation())

        act(() => {
            result.current.requestLocation()
        })

        expect(result.current.isLocating).toBe(false)
        expect(result.current.coordinates).toEqual({ lat: 40.7128, lng: -74.0060 })
        expect(result.current.error).toBeNull()
    })

    it("handles permission denied error", () => {
        mockGetCurrentPosition.mockImplementation((_, error) => {
            error({
                code: 1, // PERMISSION_DENIED
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
            })
        })

        const { result } = renderHook(() => useGeolocation())

        act(() => {
            result.current.requestLocation()
        })

        expect(result.current.isLocating).toBe(false)
        expect(result.current.coordinates).toBeNull()
        expect(result.current.error).toContain("permission denied")
    })

    it("clears location state", () => {
        // Setup initial state
        mockGetCurrentPosition.mockImplementation((success) => {
            success({ coords: { latitude: 10, longitude: 10 } })
        })

        const { result } = renderHook(() => useGeolocation())

        act(() => {
            result.current.requestLocation()
        })

        expect(result.current.coordinates).not.toBeNull()

        // Act
        act(() => {
            result.current.clearLocation()
        })

        expect(result.current.coordinates).toBeNull()
        expect(result.current.error).toBeNull()
    })

    it("handles unsupported browser", () => {
        // Remove geolocation from navigator
        Object.defineProperty(global.navigator, "geolocation", {
            value: undefined,
            writable: true
        })

        const { result } = renderHook(() => useGeolocation())

        act(() => {
            result.current.requestLocation()
        })

        expect(result.current.error).toContain("not supported")
    })
})
