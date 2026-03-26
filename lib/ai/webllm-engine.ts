import { MLCEngineInterface, CreateWebWorkerMLCEngine, CreateMLCEngine, InitProgressCallback } from "@mlc-ai/web-llm"
import { logger } from "@/lib/logger"

/**
 * Wrapper for WebLLM engine to allow easier testing and mocking.
 */
export class WebLLMEngine {
  private engine: MLCEngineInterface | null = null
  private worker: Worker | null = null

  async init(
    modelId: string,
    options: {
      initProgressCallback?: InitProgressCallback
      useWorker?: boolean
    } = {}
  ): Promise<MLCEngineInterface> {
    const { initProgressCallback, useWorker = true } = options

    try {
      if (useWorker && typeof Worker !== "undefined") {
        try {
          // This URL handling might need adjustment depending on build system
          this.worker = new Worker(new URL("./webllm.worker.ts", import.meta.url), { type: "module" })
          this.engine = await CreateWebWorkerMLCEngine(this.worker, modelId, { initProgressCallback })
          return this.engine
        } catch (err) {
          logger.warn("[WebLLMEngine] Worker init failed; falling back to main thread", { err })
          if (this.worker) {
            this.worker.terminate()
            this.worker = null
          }
        }
      }

      this.engine = await CreateMLCEngine(modelId, { initProgressCallback })
      return this.engine
    } catch (err) {
      logger.error("[WebLLMEngine] Initialization failed", { err })
      throw err
    }
  }

  async unload() {
    if (this.engine) {
      await this.engine.unload()
      this.engine = null
    }
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }

  get instance(): MLCEngineInterface | null {
    return this.engine
  }
}
