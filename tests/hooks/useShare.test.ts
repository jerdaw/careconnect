import { renderHook } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useShare } from "@/hooks/useShare"
import { Share } from "@capacitor/share"
import { Capacitor } from "@capacitor/core"

// Mock Capacitor
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    getPlatform: vi.fn(),
  },
}))

vi.mock("@capacitor/share", () => ({
  Share: {
    share: vi.fn(),
  },
}))

describe("useShare Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("identifies support correctly on web", async () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue("web")

    // Mock navigator.share
    const originalShare = navigator.share
    Object.defineProperty(navigator, "share", { value: vi.fn(), configurable: true })

    const { result } = renderHook(() => useShare())
    expect(await result.current.isSupported()).toBe(true)

    // Test unsupported
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true })
    expect(await result.current.isSupported()).toBe(false)

    Object.defineProperty(navigator, "share", { value: originalShare, configurable: true })
  })

  it("calls Share.share when supported", async () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue("ios")
    vi.mocked(Share.share).mockResolvedValue({} as any)

    const { result } = renderHook(() => useShare())
    const outcome = await result.current.share({ title: "Test" })

    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ title: "Test" }))
    expect(outcome.success).toBe(true)
  })

  it("falls back to clipboard when not supported", async () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue("web")
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true })

    // Mock navigator.clipboard
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      configurable: true,
    })

    const { result } = renderHook(() => useShare())
    const outcome = await result.current.share({ url: "https://example.com" })

    expect(mockWriteText).toHaveBeenCalledWith("https://example.com")
    expect(outcome.type).toBe("copy")
  })
})
