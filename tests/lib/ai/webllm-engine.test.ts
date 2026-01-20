import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { WebLLMEngine } from "@/lib/ai/webllm-engine"
import * as WebLLM from "@mlc-ai/web-llm"

// Mock WebLLM
vi.mock("@mlc-ai/web-llm", () => ({
  CreateMLCEngine: vi.fn(),
  CreateWebWorkerMLCEngine: vi.fn(),
}))

describe("WebLLMEngine", () => {
  let engine: WebLLMEngine
  let mockEngineInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    engine = new WebLLMEngine()
    mockEngineInstance = {
      unload: vi.fn().mockResolvedValue(undefined),
    }
  })

  afterEach(async () => {
    await engine.unload()
  })

  it("initializes without worker successfully", async () => {
    vi.mocked(WebLLM.CreateMLCEngine).mockResolvedValue(mockEngineInstance)

    const result = await engine.init("test-model", { useWorker: false })

    expect(result).toBe(mockEngineInstance)
    expect(WebLLM.CreateMLCEngine).toHaveBeenCalledWith(
      "test-model",
      expect.objectContaining({
        initProgressCallback: undefined,
      })
    )
  })

  it("initializes with worker successfully", async () => {
    // Mock Worker
    const mockWorker = { terminate: vi.fn() }
    global.Worker = vi.fn().mockImplementation(() => mockWorker) as any

    vi.mocked(WebLLM.CreateWebWorkerMLCEngine).mockResolvedValue(mockEngineInstance)

    const result = await engine.init("test-model", { useWorker: true })

    expect(result).toBe(mockEngineInstance)
    expect(WebLLM.CreateWebWorkerMLCEngine).toHaveBeenCalled()
  })

  it("falls back to main thread if worker initialization fails", async () => {
    // Mock Worker fail
    global.Worker = vi.fn().mockImplementation(() => {
      throw new Error("Worker failed")
    }) as any

    vi.mocked(WebLLM.CreateMLCEngine).mockResolvedValue(mockEngineInstance)

    const result = await engine.init("test-model", { useWorker: true })

    expect(result).toBe(mockEngineInstance)
    expect(WebLLM.CreateMLCEngine).toHaveBeenCalled()
  })

  it("unloads correctly", async () => {
    vi.mocked(WebLLM.CreateMLCEngine).mockResolvedValue(mockEngineInstance)
    await engine.init("test-model", { useWorker: false })

    await engine.unload()

    expect(mockEngineInstance.unload).toHaveBeenCalled()
    expect(engine.instance).toBeNull()
  })
})
