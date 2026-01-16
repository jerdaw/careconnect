import { CreateMLCEngine, CreateWebWorkerMLCEngine, InitProgressCallback, MLCEngineInterface } from "@mlc-ai/web-llm"

// Default to a smaller, faster model for broader device support.
// Note: Model artifacts are downloaded and cached by the browser on first use.
const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC"

const DEFAULT_TEMPERATURE = 0.3
const DEFAULT_TOP_P = 0.85
const DEFAULT_REPETITION_PENALTY = 1.1
const DEFAULT_MAX_TOKENS = 256

const STOP_SEQUENCES = [
  // Guard against common instruction-tuning artifact leakage patterns we have observed.
  "\nInstruction 2",
  "\n\nInstruction 2",
]

function sanitizeModelOutput(text: string): string {
  const leakMarkers = ["Instruction 2 (More difficult with added constraints):", "Instruction 2:"]
  for (const marker of leakMarkers) {
    const idx = text.indexOf(marker)
    if (idx >= 0) return text.slice(0, idx).trim()
  }
  return text.trim()
}

export interface RefinedSearchQuery {
  query: string
  terms: string[]
  category?: string
  needsClarification?: boolean
  clarifyingQuestion?: string
}

export interface AIState {
  isLoading: boolean
  progress: number
  text: string
  isReady: boolean
  error: string | null
}

class AIEngine {
  private engine: MLCEngineInterface | null = null
  private worker: Worker | null = null
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

      // Prefer running the engine in a Web Worker to keep the UI responsive.
      // Fall back to main-thread engine if Worker is unavailable (e.g. some test environments).
      if (typeof Worker !== "undefined") {
        try {
          this.worker = new Worker(new URL("./webllm.worker.ts", import.meta.url), { type: "module" })
          this.engine = await CreateWebWorkerMLCEngine(this.worker, SELECTED_MODEL, { initProgressCallback })
        } catch (err) {
          console.warn("[AI Engine] Worker init failed; falling back to main thread:", err)
          if (this.worker) {
            this.worker.terminate()
            this.worker = null
          }
          this.engine = await CreateMLCEngine(SELECTED_MODEL, { initProgressCallback })
        }
      } else {
        this.engine = await CreateMLCEngine(SELECTED_MODEL, { initProgressCallback })
      }

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

  public async reset() {
    if (this.engine) {
      await this.engine.resetChat()
    }
  }

  public async chat(messages: { role: "user" | "assistant" | "system"; content: string }[]): Promise<string> {
    if (!this.engine) throw new Error("AI Engine not initialized")

    try {
      // Diagnostic Logging
      const estimatedToks = messages.reduce((acc, m) => acc + m.content.length / 4, 0)
      console.log(`[AI Engine] Request: ${messages.length} msgs, ~${Math.round(estimatedToks)} tokens`)

      const reply = await this.engine.chat.completions.create({
        messages,
        temperature: DEFAULT_TEMPERATURE,
        top_p: DEFAULT_TOP_P,
        repetition_penalty: DEFAULT_REPETITION_PENALTY,
        max_tokens: DEFAULT_MAX_TOKENS,
        stop: STOP_SEQUENCES,
        extra_body: {
          enable_latency_breakdown: process.env.NODE_ENV === "development",
        },
      })

      return sanitizeModelOutput(reply.choices[0]?.message?.content || "")
    } catch (err) {
      console.error("Chat error:", err)
      throw err
    }
  }

  /**
   * Refinement step for "LLM as smarter search":
   * Returns a rewritten query + extra search terms (JSON) with NO user-facing advice.
   */
  public async refineSearchQuery(userQuery: string): Promise<RefinedSearchQuery | null> {
    if (!this.engine) return null

    const system = `You are a query rewriter for a local social services directory search in Kingston, Ontario.

Output MUST be valid JSON (no markdown, no extra text) with this schema:
{
  "query": string,                 // rewritten search query
  "terms": string[],               // 0-8 extra search terms
  "category"?: string,             // optional: Food|Housing|Health|Crisis|Legal|Employment|Income|Newcomer|Youth|Disability
  "needsClarification"?: boolean,  // optional
  "clarifyingQuestion"?: string    // optional, short
}

Rules:
- Do NOT refuse. Do NOT give advice, disclaimers, or crisis guidance.
- Do NOT mention policy, safety, or training data.
- Only rewrite/expand the query for better matching.`

    const messages = [
      { role: "system" as const, content: system },
      { role: "user" as const, content: userQuery },
    ]

    const response = await this.engine.chat.completions.create({
      messages,
      temperature: 0,
      top_p: 1,
      repetition_penalty: 1,
      max_tokens: 160,
      // Best-effort JSON mode (WebLLM supports OpenAI-compatible response_format).

      response_format: { type: "json_object" } as any,
    })

    const text = (response.choices[0]?.message?.content || "").trim()
    if (!text) return null

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) return null
      try {
        parsed = JSON.parse(match[0])
      } catch {
        return null
      }
    }

    if (!parsed || typeof parsed !== "object") return null
    const obj = parsed as Record<string, unknown>

    const query = typeof obj.query === "string" ? obj.query.trim() : ""
    const termsRaw = Array.isArray(obj.terms) ? obj.terms : []
    const terms = termsRaw
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8)

    if (!query && terms.length === 0) return null

    const category = typeof obj.category === "string" ? obj.category.trim() : undefined
    const needsClarification = typeof obj.needsClarification === "boolean" ? obj.needsClarification : undefined
    const clarifyingQuestion = typeof obj.clarifyingQuestion === "string" ? obj.clarifyingQuestion.trim() : undefined

    return {
      query: query || userQuery,
      terms,
      ...(category ? { category } : {}),
      ...(needsClarification !== undefined ? { needsClarification } : {}),
      ...(clarifyingQuestion ? { clarifyingQuestion } : {}),
    }
  }

  /**
   * Stateless streaming: intended for one-off generation where we don't want to reuse KV cache.
   */
  public async chatStreamStateless(
    messages: { role: "user" | "assistant" | "system"; content: string }[],
    onDelta: (delta: string) => void
  ): Promise<{ content: string }> {
    if (!this.engine) throw new Error("AI Engine not initialized")

    await this.engine.resetChat()

    const chunks = await this.engine.chat.completions.create({
      messages,
      stream: true,
      stream_options: { include_usage: true },
      temperature: DEFAULT_TEMPERATURE,
      top_p: DEFAULT_TOP_P,
      repetition_penalty: DEFAULT_REPETITION_PENALTY,
      max_tokens: DEFAULT_MAX_TOKENS,
      stop: STOP_SEQUENCES,
      extra_body: {
        enable_latency_breakdown: process.env.NODE_ENV === "development",
      },
    })

    let full = ""
    try {
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || ""
        if (!delta) continue
        full += delta
        onDelta(delta)
      }
    } catch (err) {
      // If generation is interrupted, prefer returning whatever we have instead of hard-failing the UI.
      if (full.trim().length > 0) {
        console.warn("[AI Engine] Stream aborted; returning partial output.")
        return { content: sanitizeModelOutput(full) }
      }
      throw err
    }

    return { content: sanitizeModelOutput(full) }
  }

  /**
   * Cached streaming: preserves KV cache across turns as long as the caller sends a consistent
   * message history. This yields much lower TTFT on multi-turn chats.
   */
  public async chatStreamWithCache(
    messages: { role: "user" | "assistant" | "system"; content: string }[],
    onDelta: (delta: string) => void
  ): Promise<{ content: string }> {
    if (!this.engine) throw new Error("AI Engine not initialized")

    const chunks = await this.engine.chat.completions.create({
      messages,
      stream: true,
      stream_options: { include_usage: true },
      temperature: DEFAULT_TEMPERATURE,
      top_p: DEFAULT_TOP_P,
      repetition_penalty: DEFAULT_REPETITION_PENALTY,
      max_tokens: DEFAULT_MAX_TOKENS,
      stop: STOP_SEQUENCES,
      extra_body: {
        enable_latency_breakdown: process.env.NODE_ENV === "development",
      },
    })

    try {
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || ""
        if (!delta) continue
        onDelta(delta)
      }
    } catch (err) {
      // If generation is interrupted, prefer returning whatever the engine has so far.
      const partial = await this.engine.getMessage()
      if (partial.trim().length > 0) {
        console.warn("[AI Engine] Stream aborted; returning partial output.")
        return { content: partial }
      }
      throw err
    }

    // Fetch the final message from engine to keep UI + internal conversation in sync.
    return { content: await this.engine.getMessage() }
  }

  /**
   * Default streaming behavior: cache-aware streaming for interactive chat UIs.
   * Prefer `chatStreamStateless` for one-off generations where chat state should not be reused.
   */
  public async chatStream(
    messages: { role: "user" | "assistant" | "system"; content: string }[],
    onDelta: (delta: string) => void
  ): Promise<{ content: string }> {
    return this.chatStreamWithCache(messages, onDelta)
  }

  public async interrupt() {
    if (!this.engine) return
    await this.engine.interruptGenerate()
  }

  public async unload() {
    if (this.engine) {
      await this.engine.unload()
      this.engine = null
      if (this.worker) {
        this.worker.terminate()
        this.worker = null
      }
      this.updateState({ isReady: false, text: "Unloaded" })
    }
  }
}

export const aiEngine = AIEngine.getInstance()
