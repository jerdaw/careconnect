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

  it("starts listening and transitions to listening state", async () => {
    const onResult = vi.fn()
    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput(onResult))

    await result.current.startListening()

    // Wait for async state update
    await vi.waitFor(() => {
      expect(result.current.state).toBe("listening")
      expect(result.current.error).toBeNull()
    })
  })

  it("handles microphone permission denial", async () => {
    const onResult = vi.fn()

    // Mock getUserMedia to reject
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
      writable: true,
      configurable: true,
    })

    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput(onResult))

    await result.current.startListening()

    // Wait for async state update
    await vi.waitFor(() => {
      expect(result.current.state).toBe("error")
      expect(result.current.error).toBe("Microphone access denied")
    })
  })

  it("stops listening and processes recording", async () => {
    const onResult = vi.fn()
    const { transcribeAudio } = await import("@/lib/ai/transcriber")
    vi.mocked(transcribeAudio).mockResolvedValue("test transcription")

    let mockMediaRecorder: any
    ;(global as any).MediaRecorder = vi.fn().mockImplementation((_stream) => {
      mockMediaRecorder = {
        start: vi.fn(),
        stop: vi.fn(() => {
          // Simulate ondataavailable and onstop callbacks
          if (mockMediaRecorder.ondataavailable) {
            mockMediaRecorder.ondataavailable({ data: new Blob(["test"], { type: "audio/webm" }) })
          }
          if (mockMediaRecorder.onstop) {
            mockMediaRecorder.onstop()
          }
        }),
        ondataavailable: null,
        onstop: null,
        state: "recording",
      }
      return mockMediaRecorder
    })

    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput(onResult))

    await result.current.startListening()
    await result.current.stopListening()

    // Wait for async processing
    await vi.waitFor(() => {
      expect(result.current.state).toBe("idle")
    })

    expect(onResult).toHaveBeenCalledWith("test transcription")
  })

  it("handles empty recording", async () => {
    const onResult = vi.fn()

    let mockMediaRecorder: any
    ;(global as any).MediaRecorder = vi.fn().mockImplementation(() => {
      mockMediaRecorder = {
        start: vi.fn(),
        stop: vi.fn(() => {
          // Simulate onstop with no data
          if (mockMediaRecorder.onstop) {
            mockMediaRecorder.onstop()
          }
        }),
        ondataavailable: null,
        onstop: null,
        state: "recording",
      }
      return mockMediaRecorder
    })

    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput(onResult))

    await result.current.startListening()
    await result.current.stopListening()

    expect(result.current.state).toBe("idle")
    expect(onResult).not.toHaveBeenCalled()
  })

  it("handles transcription errors", async () => {
    const onResult = vi.fn()
    const { transcribeAudio } = await import("@/lib/ai/transcriber")
    vi.mocked(transcribeAudio).mockRejectedValue(new Error("Transcription failed"))

    let mockMediaRecorder: any
    ;(global as any).MediaRecorder = vi.fn().mockImplementation(() => {
      mockMediaRecorder = {
        start: vi.fn(),
        stop: vi.fn(() => {
          if (mockMediaRecorder.ondataavailable) {
            mockMediaRecorder.ondataavailable({ data: new Blob(["test"], { type: "audio/webm" }) })
          }
          if (mockMediaRecorder.onstop) {
            mockMediaRecorder.onstop()
          }
        }),
        ondataavailable: null,
        onstop: null,
        state: "recording",
      }
      return mockMediaRecorder
    })

    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput(onResult))

    await result.current.startListening()
    await result.current.stopListening()

    await vi.waitFor(() => {
      expect(result.current.state).toBe("idle")
      expect(result.current.error).toBe("Failed to transcribe")
    })
  })

  it("ignores empty or whitespace-only transcriptions", async () => {
    const onResult = vi.fn()
    const { transcribeAudio } = await import("@/lib/ai/transcriber")
    vi.mocked(transcribeAudio).mockResolvedValue("   ")

    let mockMediaRecorder: any
    ;(global as any).MediaRecorder = vi.fn().mockImplementation(() => {
      mockMediaRecorder = {
        start: vi.fn(),
        stop: vi.fn(() => {
          if (mockMediaRecorder.ondataavailable) {
            mockMediaRecorder.ondataavailable({ data: new Blob(["test"], { type: "audio/webm" }) })
          }
          if (mockMediaRecorder.onstop) {
            mockMediaRecorder.onstop()
          }
        }),
        ondataavailable: null,
        onstop: null,
        state: "recording",
      }
      return mockMediaRecorder
    })

    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput(onResult))

    await result.current.startListening()
    await result.current.stopListening()

    await vi.waitFor(() => {
      expect(result.current.state).toBe("idle")
    })

    expect(onResult).not.toHaveBeenCalled()
  })

  it("handles stopListening when not recording", async () => {
    const onResult = vi.fn()
    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput(onResult))

    // Stop without starting
    result.current.stopListening()

    expect(result.current.state).toBe("idle")
  })
})
