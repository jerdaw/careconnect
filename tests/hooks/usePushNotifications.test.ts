import { renderHook, waitFor, act } from "@testing-library/react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { describe, it, expect, vi, beforeEach } from "vitest"
import OneSignal from "react-onesignal"

// Mock react-onesignal
vi.mock("react-onesignal", () => {
  const mockOneSignal = {
    init: vi.fn().mockResolvedValue(undefined),
    Notifications: {
      requestPermission: vi.fn().mockResolvedValue(undefined),
    },
    User: {
      PushSubscription: {
        id: "mock-id",
        optIn: vi.fn().mockResolvedValue(undefined),
        optOut: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      },
    },
  }
  return {
    __esModule: true,
    default: mockOneSignal,
    ...mockOneSignal,
  }
})

// Mock env
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_ONESIGNAL_APP_ID: "test-app-id",
  },
}))

describe("usePushNotifications Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window/navigator globals
    Object.defineProperty(global, "Notification", {
      value: {
        permission: "default",
      },
      configurable: true,
      writable: true,
    })

    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        register: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    Object.defineProperty(global.window, "PushManager", {
      value: vi.fn(),
      writable: true,
      configurable: true,
    })
  })

  it("initializes OneSignal on mount", async () => {
    renderHook(() => usePushNotifications())

    await waitFor(() => {
      expect(OneSignal.init).toHaveBeenCalledWith(
        expect.objectContaining({
          appId: "test-app-id",
        })
      )
    })
  })

  it("checks support correctly", async () => {
    const { result } = renderHook(() => usePushNotifications())

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true)
    })
  })

  it("handles unsupported browsers", async () => {
    const win = global.window as any
    delete win.PushManager

    const { result } = renderHook(() => usePushNotifications())

    await waitFor(() => {
      expect(result.current.isSupported).toBe(false)
    })
  })

  it("subscribes using OneSignal", async () => {
    const { result } = renderHook(() => usePushNotifications())

    // Wait for init
    await waitFor(() => expect(OneSignal.init).toHaveBeenCalled())

    await act(async () => {
      await result.current.subscribe()
    })

    expect(OneSignal.Notifications.requestPermission).toHaveBeenCalled()
    expect(OneSignal.User.PushSubscription.optIn).toHaveBeenCalled()
  })

  it("unsubscribes using OneSignal", async () => {
    const { result } = renderHook(() => usePushNotifications())

    // Wait for init
    await waitFor(() => expect(OneSignal.init).toHaveBeenCalled())

    await act(async () => {
      await result.current.unsubscribe()
    })

    expect(OneSignal.User.PushSubscription.optOut).toHaveBeenCalled()
  })
})
