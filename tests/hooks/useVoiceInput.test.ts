import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"

// Mock dependencies before importing hook
vi.mock("@/lib/ai/transcriber", () => ({
  transcribeAudio: vi.fn(),
}))

describe("useVoiceInput", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock MediaRecorder
    if (typeof window !== "undefined") {
      ;(global as any).MediaRecorder = vi.fn().mockImplementation(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        ondataavailable: null,
        onstop: null,
        state: "inactive",
      })) as any
      ;(global.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true)

      // Mock navigator.mediaDevices
      Object.defineProperty(global.navigator, "mediaDevices", {
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }],
          }),
        },
        writable: true,
        configurable: true,
      })
    }
  })

  it("initializes with correct default state", async () => {
    const onResult = vi.fn()
    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput(onResult))

    expect(result.current.state).toBe("idle")
    expect(result.current.error).toBeNull()
  })

  it("detects browser support correctly", async () => {
    const onResult = vi.fn()
    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput(onResult))

    expect(result.current.isSupported).toBe(true)
  })

  it("handles missing MediaRecorder gracefully", async () => {
    const onResult = vi.fn()
    // Delete instead of setting to undefined to ensure "MediaRecorder" in window is false
    delete (global as any).MediaRecorder
    if (typeof window !== "undefined") {
      delete (window as any).MediaRecorder
    }

    // Re-import to get fresh module
    vi.resetModules()
    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput(onResult))

    // If MediaRecorder is missing, isSupported should be false
    // Note: useVoiceInput check for "MediaRecorder" in window
    expect(result.current.isSupported).toBe(false)
  })
})
