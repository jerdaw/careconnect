import { useState, useEffect, useRef, useCallback } from "react"
import { logger } from "@/lib/logger"

export interface WorkerStatus {
  isReady: boolean
  progress: number | null // 0-100
  error: string | null
}

export const useSemanticSearch = () => {
  const worker = useRef<Worker | null>(null)
  const [status, setStatus] = useState<WorkerStatus>({ isReady: false, progress: null, error: null })

  useEffect(() => {
    if (!worker.current) {
      // Create the worker instance
      worker.current = new Worker(new URL("../app/worker.ts", import.meta.url))

      // Message Listener
      worker.current.addEventListener("message", (event) => {
        const { status, data, error } = event.data

        if (status === "progress" && data.status === "progress") {
          // Downloading model: data.progress is percentage
          setStatus((prev) => ({ ...prev, progress: data.progress }))
        }

        if (status === "ready") {
          logger.info("🧠 Semantic Search Model Ready", { component: "useSemanticSearch" })
          setStatus({ isReady: true, progress: 100, error: null })
        }

        if (status === "error") {
          logger.error("Worker Error:", error, { component: "useSemanticSearch" })
          setStatus((prev) => ({ ...prev, error: typeof error === 'string' ? error : "Failed to load model" }))
        }
      })

      // Error Listener (catches worker script errors like syntax errors or throw)
      worker.current.addEventListener("error", (event) => {
          logger.error("Worker Script Error:", event.message, { component: "useSemanticSearch" })
          setStatus((prev) => ({ ...prev, error: `Worker Error: ${event.message}` }))
      });

        // Start Initialization
      worker.current.postMessage({ action: "init" })
    }

    return () => {
      if (worker.current) {
        worker.current.terminate()
      }
    }
  }, [])

  const generateEmbedding = useCallback(
    (text: string): Promise<number[] | null> => {
      return new Promise((resolve) => {
        if (!worker.current || !status.isReady) {
          resolve(null)
          return
        }

        const handler = (event: MessageEvent) => {
          const { status, embedding, text: responseText } = event.data
          if (status === "complete" && responseText === text) {
            worker.current?.removeEventListener("message", handler)
            resolve(embedding)
          }
        }

        worker.current.addEventListener("message", handler)
        worker.current.postMessage({ action: "embed", text })
      })
    },
    [status.isReady]
  )

  return { isReady: status.isReady, progress: status.progress, error: status.error, generateEmbedding }
}
