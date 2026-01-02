// Configure Transformers.js to use local models or CDN
// We use dynamic imports to avoid loading the library on initial page load (and prevent test crashes)

// Singleton to hold the model instance
class WhisperTranscriber {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static instance: any = null
  private static isLoading = false

  static async getInstance() {
    if (this.instance) return this.instance

    if (this.isLoading) {
      // Wait for existing initialization
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      return this.instance
    }

    this.isLoading = true
    try {
      // Dynamic import to prevent side effects during testing/SSG and optimize load time
      const { pipeline, env } = await import("@xenova/transformers")

      // Configure Transformers.js
      env.allowLocalModels = false // We'll fetch from Xenova CDN for this demo to minimize repo size
      env.useBrowserCache = true

      // Load Whisper Tiny (quantized) - ~40MB
      // Task: automatic-speech-recognition
      // Model: Xenova/whisper-tiny.en
      this.instance = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en", {
        quantized: true,
      })
      console.log("✅ [Transcriber] Whisper model loaded successfully")
    } catch (error) {
      console.error("❌ [Transcriber] Failed to load model", error)
      throw error
    } finally {
      this.isLoading = false
    }

    return this.instance
  }
}

// Helper to convert audio Blob to float32 array
async function convertBlobToAudioData(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 16000, // Whisper expects 16kHz
  })

  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  return audioBuffer.getChannelData(0) // Get first channel
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const transcriber = await WhisperTranscriber.getInstance()
    const audioData = await convertBlobToAudioData(audioBlob)

    const output = await transcriber(audioData)

    // Output format is { text: "..." } or [{ text: "..." }] depending on version
    // Output format requires casting as the pipeline return type is generic
    type TranscriberResult = { text: string }
    const result = output as TranscriberResult | TranscriberResult[]
    const text = Array.isArray(result) ? (result[0]?.text ?? "") : result.text
    return text.trim()
  } catch (error) {
    console.error("Transcription failed:", error)
    throw new Error("Failed to transcribe audio")
  }
}
