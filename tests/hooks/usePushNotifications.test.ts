import { renderHook, waitFor, act } from "@testing-library/react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock dependencies
// Mock dependencies
const mockSetPreferences = vi.fn()
const mockPreferences: any[] = [] // Stable reference

vi.mock("@/hooks/useLocalStorage", () => ({
    useLocalStorage: () => [mockPreferences, mockSetPreferences],
}))

vi.mock("@/lib/notifications/push-manager", () => ({
    pushManager: {
        getPermissionStatus: vi.fn(),
        requestPermission: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
    },
}))

import { pushManager } from "@/lib/notifications/push-manager"

describe("usePushNotifications Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Mock browser globals
        Object.defineProperty(global.window, "PushManager", {
            value: class PushManager { },
            writable: true,
            configurable: true,
        })

        Object.defineProperty(global.navigator, "serviceWorker", {
            value: {
                ready: Promise.resolve({
                    pushManager: {
                        getSubscription: vi.fn().mockResolvedValue(null)
                    }
                })
            },
            writable: true
        })
    })

    afterEach(() => {
        // cleanup globals
    })

    it("initializes with loading state and checks support", async () => {
        ; (pushManager.getPermissionStatus as any).mockResolvedValue("default")

        const { result } = renderHook(() => usePushNotifications())

        expect(result.current.isLoading).toBe(true)

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isSupported).toBe(true)
            expect(result.current.permission).toBe("default")
        })
    })

    it("handles unsupported browser", async () => {
        // @ts-ignore
        delete global.window.PushManager

        const { result } = renderHook(() => usePushNotifications())

        await waitFor(() => {
            expect(result.current.isSupported).toBe(false)
            expect(result.current.isLoading).toBe(false)
        })
    })

    it("subscribes successfully", async () => {
        ; (pushManager.getPermissionStatus as any).mockResolvedValue("default")
            ; (pushManager.requestPermission as any).mockResolvedValue(true)
            ; (pushManager.subscribe as any).mockResolvedValue({ endpoint: "test" })

        const { result } = renderHook(() => usePushNotifications())

        await waitFor(() => expect(result.current.isLoading).toBe(false))

        await act(async () => {
            const success = await result.current.subscribe(["crisis"])
            expect(success).toBe(true)
        })

        expect(result.current.isSubscribed).toBe(true)
        expect(result.current.permission).toBe("granted")
        expect(result.current.subscribedCategories).toEqual(["crisis"])
        expect(mockSetPreferences).toHaveBeenCalledWith(["crisis"])
    })

    it("handles subscription denial", async () => {
        ; (pushManager.getPermissionStatus as any).mockResolvedValue("default")
            ; (pushManager.requestPermission as any).mockResolvedValue(false)

        const { result } = renderHook(() => usePushNotifications())
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        await act(async () => {
            const success = await result.current.subscribe(["crisis"])
            expect(success).toBe(false)
        })

        expect(result.current.permission).toBe("denied")
        expect(result.current.isSubscribed).toBe(false)
    })

    it("unsubscribes successfully", async () => {
        // Start as subscribed
        Object.defineProperty(global.navigator, "serviceWorker", {
            value: {
                ready: Promise.resolve({
                    pushManager: {
                        getSubscription: vi.fn().mockResolvedValue({ endpoint: "test" })
                    }
                })
            },
            writable: true
        })
            ; (pushManager.getPermissionStatus as any).mockResolvedValue("granted")
            ; (pushManager.unsubscribe as any).mockResolvedValue(true)

        const { result } = renderHook(() => usePushNotifications())
        await waitFor(() => expect(result.current.isSubscribed).toBe(true))

        await act(async () => {
            const success = await result.current.unsubscribe()
            expect(success).toBe(true)
        })

        expect(result.current.isSubscribed).toBe(false)
        expect(result.current.subscribedCategories).toEqual([])
        expect(mockSetPreferences).toHaveBeenCalledWith([])
    })
})
