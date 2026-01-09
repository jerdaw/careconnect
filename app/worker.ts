/* eslint-disable @typescript-eslint/no-explicit-any */





let pipeline: any = null;
let env: any = null;
let isMockMode = false;

class OptimizePipeline {
  static task = "feature-extraction"
  static model = "Xenova/all-MiniLM-L6-v2"
  static instance: any = null

  static async loadLibrary() {
      if (!pipeline && !isMockMode) {
          try {
            let transformers: any;
             try {
                 // @ts-expect-error - URL imports are not typed in standard TS without config
                 transformers = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');

             } catch (cdnErr) {
                 console.warn("[Worker] CDN import failed, trying local", cdnErr);
                 transformers = await import('@xenova/transformers');
             }

            // Handle CJS vs ESM default exports
            if (transformers.default && !transformers.pipeline) {
                transformers = transformers.default;
            }

            pipeline = transformers.pipeline;
            env = transformers.env;
            
            if (!pipeline) {
                throw new Error("Pipeline undefined after import");
            }


            
            if (env) {
                env.allowLocalModels = false;
                env.useBrowserCache = true;
            }
          } catch (e: any) {
              console.error("[Worker] CRITICAL: Failed to load transformers library. Message:", e?.message || String(e));
              console.warn("[Worker] Switching to MOCK MODE to allow UI testing.");
              isMockMode = true;
          }
      }
  }

  static async getInstance(progress_callback: (data: any) => void) {
    await this.loadLibrary();

    if (isMockMode) {
        // Simulate progress for mock mode
        progress_callback({ status: 'progress', progress: 10 });
        await new Promise(r => setTimeout(r, 500));
        progress_callback({ status: 'progress', progress: 50 });
        await new Promise(r => setTimeout(r, 500));
        progress_callback({ status: 'progress', progress: 100 });
        return "MOCK_PIPELINE";
    }

    if (this.instance === null) {
      if (!pipeline) throw new Error("Transformers library not loaded");
      this.instance = await pipeline(this.task as any, this.model, { progress_callback })
    }
    return this.instance
  }
}

self.addEventListener("message", async (event) => {
  const { action, text } = event.data

  if (action === "init") {
    try {
      await OptimizePipeline.getInstance((data: any) => {
        self.postMessage({ status: "progress", data })
      })
      
      self.postMessage({ status: "ready" })
      
    } catch (error: any) {
        console.error("[Worker] Init error:", error);
        // Even on error, if we want to debug UI, we could send ready.
        // But for now let's report the error.
        self.postMessage({ status: "error", error: error?.message || String(error) })
    }
    return
  }

  if (action === "embed") {
    if (isMockMode) {
        // Return dummy embedding
        self.postMessage({ status: "complete", embedding: new Array(384).fill(0.1), text })
        return;
    }

    try {
      const pipe = await OptimizePipeline.getInstance(() => {})
      const output = await pipe(text, { pooling: "mean", normalize: true })

      if (!output?.data) {
        self.postMessage({ status: "error", error: "Embedding output undefined" })
        return
      }

      const embedding = Array.from(output.data)
      self.postMessage({ status: "complete", embedding, text })
    } catch (error: any) {
        console.error("[Worker] Embed error:", error);
      self.postMessage({ status: "error", error: String(error) })
    }
    return
  }
})
