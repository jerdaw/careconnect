import { describe, it, expect, vi, beforeEach } from "vitest"
import { pipeline } from "@xenova/transformers"

// Mock transformers
vi.mock("@xenova/transformers", () => ({
    pipeline: vi.fn(),
    env: { allowLocalModels: false, useBrowserCache: true }
}))

// Mock AudioContext
const mockDecodeAudioData = vi.fn()
const mockGetChannelData = vi.fn().mockReturnValue(new Float32Array([0.1, 0.2]))

global.AudioContext = vi.fn().mockImplementation(() => ({
    decodeAudioData: mockDecodeAudioData,
})) as unknown as typeof AudioContext
    ; (global as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext = global.AudioContext


describe("Audio Transcriber", () => {
    beforeEach(() => {
        vi.resetModules() // Reset modules to clear singleton
        vi.clearAllMocks() // Clear mock history

        mockDecodeAudioData.mockResolvedValue({
            getChannelData: mockGetChannelData
        })
    })

    const getTranscriberModule = async () => import("@/lib/ai/transcriber")

    it("initializes and transcribes audio successfully", async () => {
        const mockTranscriber = vi.fn().mockResolvedValue({ text: "Hello world" })
            ; (pipeline as any).mockResolvedValue(mockTranscriber)

        const blob = new Blob(["test"], { type: "audio/wav" })
        blob.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

        // Dynamic import
        const { transcribeAudio } = await getTranscriberModule()
        const result = await transcribeAudio(blob)

        expect(pipeline).toHaveBeenCalledWith("automatic-speech-recognition", "Xenova/whisper-tiny.en", expect.any(Object))
        expect(mockTranscriber).toHaveBeenCalled()
        expect(result).toBe("Hello world")
    })

    it("handles transcription failure", async () => {
        const mockTranscriber = vi.fn().mockRejectedValue(new Error("Transcribe failed"))
            ; (pipeline as any).mockResolvedValue(mockTranscriber)

        const blob = new Blob(["test"], { type: "audio/wav" })
        blob.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

        const { transcribeAudio } = await getTranscriberModule()

        await expect(transcribeAudio(blob)).rejects.toThrow("Failed to transcribe audio")
    })
})
