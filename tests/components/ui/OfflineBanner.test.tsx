import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OfflineBanner } from "@/components/ui/OfflineBanner"

// Mock dependencies
vi.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(),
}))

vi.mock("@/lib/offline/sync", () => ({
  syncOfflineData: vi.fn(),
}))

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { syncOfflineData } from "@/lib/offline/sync"
import { useTranslations } from "next-intl"

describe("OfflineBanner", () => {
  const mockUseNetworkStatus = vi.mocked(useNetworkStatus)
  const mockSyncOfflineData = vi.mocked(syncOfflineData)
  const mockUseTranslations = vi.mocked(useTranslations)

  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      bannerMessage: "You're offline. Some features may be unavailable.",
      checkConnection: "Check Connection",
    }
    return translations[key] || key
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTranslations.mockReturnValue(mockT as any)
    mockSyncOfflineData.mockResolvedValue({} as any)
  })

  describe("Rendering", () => {
    it("should not render when online", () => {
      mockUseNetworkStatus.mockReturnValue({
        isOffline: false,
        isOnline: true,
      } as any)

      const { container } = render(<OfflineBanner />)
      expect(container.firstChild).toBeNull()
    })

    it("should render banner when offline", () => {
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
      } as any)

      render(<OfflineBanner />)

      expect(screen.getByText("You're offline. Some features may be unavailable.")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /check connection/i })).toBeInTheDocument()
    })

    it("should display WifiOff icon when offline", () => {
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
      } as any)

      const { container } = render(<OfflineBanner />)

      // Check for icon presence (lucide-react renders as svg)
      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
    })
  })

  describe("Translation", () => {
    it("should use correct translation keys", () => {
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
      } as any)

      render(<OfflineBanner />)

      expect(mockT).toHaveBeenCalledWith("bannerMessage")
      expect(mockT).toHaveBeenCalledWith("checkConnection")
    })
  })

  describe("Sync Button", () => {
    it("should call syncOfflineData when refresh button is clicked", async () => {
      const user = userEvent.setup()
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
      } as any)

      render(<OfflineBanner />)

      const button = screen.getByRole("button", { name: /check connection/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockSyncOfflineData).toHaveBeenCalledWith(true)
      })
    })

    it("should disable button while syncing", async () => {
      const user = userEvent.setup()
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
      } as any)

      // Make sync take some time
      mockSyncOfflineData.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 50)))

      render(<OfflineBanner />)

      const button = screen.getByRole("button", { name: /check connection/i })

      // Click and check if disabled
      await user.click(button)

      await waitFor(() => {
        expect(button).toBeDisabled()
      })

      // Wait for sync to complete (50ms sync + 1000ms offline delay)
      await waitFor(
        () => {
          expect(button).not.toBeDisabled()
        },
        { timeout: 1200 }
      )
    })

    it("should show spinning icon while syncing", async () => {
      const user = userEvent.setup()
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
      } as any)

      mockSyncOfflineData.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      const { container } = render(<OfflineBanner />)

      const button = screen.getByRole("button", { name: /check connection/i })
      user.click(button)

      await waitFor(() => {
        const rotatingIcon = container.querySelector(".animate-spin")
        expect(rotatingIcon).toBeInTheDocument()
      })
    })

    it("should handle sync when truly offline (with delay)", async () => {
      const user = userEvent.setup()
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
      } as any)

      render(<OfflineBanner />)

      const button = screen.getByRole("button", { name: /check connection/i })

      // Click and wait for all async operations to complete
      await user.click(button)

      // Should still call sync
      expect(mockSyncOfflineData).toHaveBeenCalledWith(true)

      // Wait for button to be disabled first
      await waitFor(() => {
        expect(button).toBeDisabled()
      })

      // Wait for simulated delay and re-enable (1000ms delay)
      await waitFor(
        () => {
          expect(button).not.toBeDisabled()
        },
        { timeout: 1500 }
      )

      // Add small delay to ensure setState completes
      await new Promise((r) => setTimeout(r, 50))
    })
  })

  describe("Accessibility", () => {
    it("should have accessible button with proper label", () => {
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
      } as any)

      render(<OfflineBanner />)

      const button = screen.getByRole("button", { name: /check connection/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAccessibleName()
    })

    it("should indicate disabled state to screen readers", async () => {
      const user = userEvent.setup()
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
      } as any)

      mockSyncOfflineData.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      render(<OfflineBanner />)

      const button = screen.getByRole("button", { name: /check connection/i })

      user.click(button)

      await waitFor(() => {
        expect(button).toHaveAttribute("disabled")
      })
    })
  })
})
