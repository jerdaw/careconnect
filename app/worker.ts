/* eslint-disable @typescript-eslint/no-explicit-any -- Web Worker: no access to typed module graph; transformers.js types not exported */

let pipeline: any = null
let env: any = null

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

class OptimizePipeline {
  static task = "feature-extraction"
  static model = "Xenova/all-MiniLM-L6-v2"
  static instance: any = null

  static async loadLibrary() {
    if (pipeline) {
      return
    }

    try {
      let transformers: any
      try {
        // Dynamic CDN import - bypassing TypeScript module resolution
        transformers = await import("@xenova/transformers").catch(async () => {
          // Fallback: use dynamic import with inline comment
          const url = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2"
          return await import(/* webpackIgnore: true */ /* @vite-ignore */ url as any)
        })
      } catch (cdnErr) {
        console.warn("[Worker] CDN import failed, trying local", cdnErr)
        transformers = await import("@xenova/transformers")
      }

      // Handle CJS vs ESM default exports
      if (transformers.default && !transformers.pipeline) {
        transformers = transformers.default
      }

      pipeline = transformers.pipeline
      env = transformers.env

      if (!pipeline) {
        throw new Error("Pipeline undefined after import")
      }

      if (env) {
        env.allowLocalModels = false
        env.useBrowserCache = true
      }
    } catch (error: unknown) {
      console.error("[Worker] CRITICAL: Failed to load transformers library. Message:", getErrorMessage(error))
      throw error
    }
  }

  static async getInstance(progress_callback: (data: any) => void) {
    await this.loadLibrary()

    if (this.instance === null) {
      if (!pipeline) throw new Error("Transformers library not loaded")
      this.instance = await pipeline(this.task as any, this.model, { progress_callback })
    }
    return this.instance
  }
}

self.addEventListener("message", async (event) => {
  const { action, text, requestId } = event.data

  if (action === "init") {
    try {
      await OptimizePipeline.getInstance((data: any) => {
        self.postMessage({ status: "progress", data })
      })

      self.postMessage({ status: "ready" })
    } catch (error: any) {
      console.error("[Worker] Init error:", error)
      // Even on error, if we want to debug UI, we could send ready.
      // But for now let's report the error.
      self.postMessage({ status: "error", error: error?.message || String(error) })
    }
    return
  }

  if (action === "embed") {
    try {
      const pipe = await OptimizePipeline.getInstance(() => {})
      const output = await pipe(text, { pooling: "mean", normalize: true })

      if (!output?.data) {
        self.postMessage({ status: "error", error: "Embedding output undefined", requestId, text })
        return
      }

      const embedding = Array.from(output.data)
      self.postMessage({ status: "complete", embedding, requestId, text })
    } catch (error: unknown) {
      console.error("[Worker] Embed error:", error)
      self.postMessage({ status: "error", error: getErrorMessage(error), requestId, text })
    }
    return
  }
})
