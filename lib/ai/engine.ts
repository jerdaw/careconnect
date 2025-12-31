import { CreateMLCEngine, MLCEngine, InitProgressCallback } from "@mlc-ai/web-llm"

// Using Phi-3 Mini (3.8B parameters) optimized for web
// This model strikes a balance between size (2.3GB download) and reasoning capability.
const SELECTED_MODEL = "Phi-3-mini-4k-instruct-q4f16_1-MLC"

export interface AIState {
  isLoading: boolean
  progress: number
  text: string
  isReady: boolean
  error: string | null
}

class AIEngine {
  private engine: MLCEngine | null = null
  private static instance: AIEngine

  // Listeners for progress updates
  private listeners: ((state: AIState) => void)[] = []
  private state: AIState = {
    isLoading: false,
    progress: 0,
    text: "Initializing...",
    isReady: false,
    error: null,
  }

  private constructor() {}

  public static getInstance(): AIEngine {
    if (!AIEngine.instance) {
      AIEngine.instance = new AIEngine()
    }
    return AIEngine.instance
  }

  public subscribe(listener: (state: AIState) => void) {
    this.listeners.push(listener)
    listener(this.state) // Immediate update
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  public get isReady(): boolean {
    return this.state.isReady
  }

  private updateState(newState: Partial<AIState>) {
    this.state = { ...this.state, ...newState }
    this.listeners.forEach((l) => l(this.state))
  }

  public async init() {
    if (this.engine || this.state.isLoading) return

    this.updateState({ isLoading: true, error: null })

    const initProgressCallback: InitProgressCallback = (report) => {
      console.log("AI Init:", report.text)
      this.updateState({
        progress: report.progress,
        text: report.text,
      })
    }

    try {
      // Check for WebGPU support
      if (!navigator.gpu) {
        throw new Error(
          "WebGPU is not supported on this device. Please update your browser or use a compatible device."
        )
      }

      this.engine = await CreateMLCEngine(SELECTED_MODEL, { initProgressCallback })

      this.updateState({
        isLoading: false,
        isReady: true,
        text: "Ready",
      })
    } catch (err) {
      console.error("Failed to initialize AI:", err)
      this.updateState({
        isLoading: false,
        isReady: false,
        error: (err as Error).message || "Failed to load model",
      })
    }
  }

  public async chat(messages: { role: "user" | "assistant" | "system"; content: string }[]): Promise<string> {
    if (!this.engine) throw new Error("AI Engine not initialized")

    try {
      const reply = await this.engine.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 512, // Keep responses concise
      })

      return reply.choices[0]?.message?.content || ""
    } catch (err) {
      console.error("Chat error:", err)
      throw err
    }
  }

  public async unload() {
    if (this.engine) {
      await this.engine.unload()
      this.engine = null
      this.updateState({ isReady: false, text: "Unloaded" })
    }
  }
}

export const aiEngine = AIEngine.getInstance()
