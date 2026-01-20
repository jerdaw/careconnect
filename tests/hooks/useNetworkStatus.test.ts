import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { Capacitor } from "@capacitor/core"
import { Network } from "@capacitor/network"

// Mock Capacitor
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}))

vi.mock("@capacitor/network", () => ({
  Network: {
    getStatus: vi.fn(),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  },
}))

describe("useNetworkStatus Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
  })

  it("returns initial web status correctly", async () => {
    // Mock navigator.onLine
    const spy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true)

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)

    spy.mockRestore()
  })

  it("updates when web status changes to offline", async () => {
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      window.dispatchEvent(new Event("offline"))
    })

    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOffline).toBe(true)
  })

  it("updates when web status changes to online", async () => {
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      window.dispatchEvent(new Event("offline"))
      window.dispatchEvent(new Event("online"))
    })

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
  })

  it("handles native platform status", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Network.getStatus).mockResolvedValue({ connected: true, connectionType: "wifi" } as any)

    const { result } = renderHook(() => useNetworkStatus())

    await act(async () => {
      // Wait for initial checkStatus
    })

    expect(result.current.connectionType).toBe("wifi")
  })
})
