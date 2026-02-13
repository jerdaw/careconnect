import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { OfflineSync } from "@/components/offline/OfflineSync"

// Mock dependencies
vi.mock("next-intl", () => ({
  useLocale: vi.fn(),
}))

vi.mock("@/lib/offline/sync", () => ({
  syncOfflineData: vi.fn(),
}))

vi.mock("@/lib/offline/feedback", () => ({
  syncPendingFeedback: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

import { useLocale } from "next-intl"
import { syncOfflineData } from "@/lib/offline/sync"
import { syncPendingFeedback } from "@/lib/offline/feedback"
import { logger } from "@/lib/logger"

describe("OfflineSync", () => {
  const mockUseLocale = vi.mocked(useLocale)
  const mockSyncOfflineData = vi.mocked(syncOfflineData)
  const mockSyncPendingFeedback = vi.mocked(syncPendingFeedback)
  const mockLogger = vi.mocked(logger)

  let requestIdleCallbackSpy: any
  let onlineListeners: ((event: Event) => void)[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocale.mockReturnValue("en")
    mockSyncOfflineData.mockResolvedValue({ status: "synced" } as any)
    mockSyncPendingFeedback.mockResolvedValue(undefined)
    onlineListeners = []

    // Ensure requestIdleCallback exists before spying
    if (!window.requestIdleCallback) {
      window.requestIdleCallback = (callback: any) => {
        callback()
        return 0
      }
    }

    // Mock window.requestIdleCallback
    requestIdleCallbackSpy = vi.spyOn(window, "requestIdleCallback").mockImplementation((callback: any) => {
      callback()
      return 0
    })

    // Mock addEventListener to capture online event listener
    vi.spyOn(window, "addEventListener").mockImplementation((event: string, listener: any) => {
      if (event === "online") {
        onlineListeners.push(listener)
      }
    })

    // Mock removeEventListener
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {})
  })

  afterEach(() => {
    requestIdleCallbackSpy?.mockRestore()
    vi.restoreAllMocks()
  })

  describe("Rendering", () => {
    it("should render nothing (null component)", () => {
      const { container } = render(<OfflineSync />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe("Initial Sync", () => {
    it("should call syncOfflineData on mount using requestIdleCallback", async () => {
      render(<OfflineSync />)

      await waitFor(() => {
        expect(requestIdleCallbackSpy).toHaveBeenCalled()
        expect(mockSyncOfflineData).toHaveBeenCalled()
      })
    })

    it("should call syncPendingFeedback on mount", async () => {
      render(<OfflineSync />)

      await waitFor(() => {
        expect(mockSyncPendingFeedback).toHaveBeenCalled()
      })
    })

    it("should log success when sync completes", async () => {
      render(<OfflineSync />)

      await waitFor(() => {
        expect(mockLogger.info).toHaveBeenCalledWith("Offline data synced successfully", {
          component: "OfflineSync",
          action: "initial_sync",
        })
      })
    })

    it("should log error when sync fails", async () => {
      const error = new Error("Sync failed")
      mockSyncOfflineData.mockRejectedValue(error)

      render(<OfflineSync />)

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith("Offline sync failed", error, {
          component: "OfflineSync",
        })
      })
    })

    it("should log error when feedback sync fails", async () => {
      const error = new Error("Feedback sync failed")
      mockSyncPendingFeedback.mockRejectedValue(error)

      render(<OfflineSync />)

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith("Pending feedback sync failed", error, {
          component: "OfflineSync",
        })
      })
    })
  })

  describe("requestIdleCallback Fallback", () => {
    it("should use setTimeout when requestIdleCallback is not available", async () => {
      // Mock missing requestIdleCallback
      requestIdleCallbackSpy.mockRestore()
      const originalRequestIdleCallback = window.requestIdleCallback
      delete (window as any).requestIdleCallback

      const setTimeoutSpy = vi.spyOn(global, "setTimeout")

      render(<OfflineSync />)

      await waitFor(() => {
        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000)
      })

      setTimeoutSpy.mockRestore()
      window.requestIdleCallback = originalRequestIdleCallback
    })
  })

  describe("Online Event Listener", () => {
    it("should register online event listener", () => {
      render(<OfflineSync />)

      expect(window.addEventListener).toHaveBeenCalledWith("online", expect.any(Function))
    })

    it("should trigger resync when online event fires", async () => {
      render(<OfflineSync />)

      // Wait for initial sync
      await waitFor(() => {
        expect(mockSyncOfflineData).toHaveBeenCalledTimes(1)
      })

      // Clear mock calls
      mockSyncOfflineData.mockClear()
      mockSyncPendingFeedback.mockClear()

      // Fire online event
      const onlineEvent = new Event("online")
      onlineListeners.forEach((listener) => listener(onlineEvent))

      await waitFor(() => {
        expect(mockSyncOfflineData).toHaveBeenCalled()
        expect(mockSyncPendingFeedback).toHaveBeenCalled()
      })
    })

    it("should log network restore message when online", async () => {
      render(<OfflineSync />)

      // Clear mock calls from initial sync
      mockLogger.info.mockClear()

      // Fire online event
      const onlineEvent = new Event("online")
      onlineListeners.forEach((listener) => listener(onlineEvent))

      await waitFor(() => {
        expect(mockLogger.info).toHaveBeenCalledWith("Network restored, checking for updates...", {
          component: "OfflineSync",
          action: "network_restore",
        })
      })
    })

    it("should cleanup online listener on unmount", () => {
      const { unmount } = render(<OfflineSync />)

      unmount()

      expect(window.removeEventListener).toHaveBeenCalledWith("online", expect.any(Function))
    })
  })

  describe("Offline Fallback Prewarm", () => {
    it("should fetch /offline to prewarm cache", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response())

      render(<OfflineSync />)

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith("/offline")
      })

      fetchSpy.mockRestore()
    })

    it("should log warning when prewarm fails", async () => {
      const error = new Error("Fetch failed")
      const fetchSpy = vi.spyOn(global, "fetch").mockRejectedValue(error)

      render(<OfflineSync />)

      await waitFor(() => {
        expect(mockLogger.warn).toHaveBeenCalledWith("Offline fallback prewarm failed", {
          err: error,
          locale: "en",
        })
      })

      fetchSpy.mockRestore()
    })

    it("should re-prewarm when locale changes", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response())

      const { rerender } = render(<OfflineSync />)

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1)
      })

      // Change locale
      mockUseLocale.mockReturnValue("fr")
      rerender(<OfflineSync />)

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2)
      })

      fetchSpy.mockRestore()
    })
  })

  describe("Multiple Instances", () => {
    it("should handle multiple sync calls gracefully", async () => {
      render(<OfflineSync />)
      render(<OfflineSync />)

      await waitFor(() => {
        expect(mockSyncOfflineData).toHaveBeenCalledTimes(2)
        expect(mockSyncPendingFeedback).toHaveBeenCalledTimes(2)
      })
    })
  })
})
