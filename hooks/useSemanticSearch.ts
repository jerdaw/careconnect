import { useState, useEffect, useRef, useCallback } from "react"
import { logger } from "@/lib/logger"

export interface WorkerStatus {
  isReady: boolean
  hasStarted: boolean
  isInitializing: boolean
  progress: number | null // 0-100
  error: string | null
}

export const useSemanticSearch = () => {
  const worker = useRef<Worker | null>(null)
  const initPromiseRef = useRef<Promise<void> | null>(null)
  const initResolverRef = useRef<{ resolve: () => void; reject: (error: Error) => void } | null>(null)
  const [status, setStatus] = useState<WorkerStatus>({
    isReady: false,
    hasStarted: false,
    isInitializing: false,
    progress: null,
    error: null,
  })

  const ensureWorker = useCallback(() => {
    if (worker.current) {
      return worker.current
    }

    const nextWorker = new Worker(new URL("../app/worker.ts", import.meta.url))

    nextWorker.addEventListener("message", (event) => {
      const { status: eventStatus, data, error } = event.data

      if (eventStatus === "progress" && data.status === "progress") {
        setStatus((prev) => ({ ...prev, hasStarted: true, isInitializing: true, progress: data.progress }))
      }

      if (eventStatus === "ready") {
        setStatus({
          isReady: true,
          hasStarted: true,
          isInitializing: false,
          progress: 100,
          error: null,
        })
        initResolverRef.current?.resolve()
        initResolverRef.current = null
      }

      if (eventStatus === "error") {
        const message = typeof error === "string" ? error : "Failed to load model"
        logger.error("Worker Error:", message, { component: "useSemanticSearch" })
        setStatus((prev) => ({
          ...prev,
          hasStarted: true,
          isInitializing: false,
          error: message,
        }))
        initResolverRef.current?.reject(new Error(message))
        initResolverRef.current = null
      }
    })

    nextWorker.addEventListener("error", (event) => {
      const message = `Worker Error: ${event.message}`
      logger.error("Worker Script Error:", event.message, { component: "useSemanticSearch" })
      setStatus((prev) => ({
        ...prev,
        hasStarted: true,
        isInitializing: false,
        error: message,
      }))
      initResolverRef.current?.reject(new Error(message))
      initResolverRef.current = null
    })

    worker.current = nextWorker
    return nextWorker
  }, [])

  const initSemanticSearch = useCallback(async () => {
    if (status.isReady) {
      return
    }

    if (initPromiseRef.current) {
      return initPromiseRef.current
    }

    const activeWorker = ensureWorker()
    setStatus((prev) => ({
      ...prev,
      hasStarted: true,
      isInitializing: true,
      progress: prev.progress ?? 0,
      error: null,
    }))

    initPromiseRef.current = new Promise<void>((resolve, reject) => {
      initResolverRef.current = { resolve, reject }
      activeWorker.postMessage({ action: "init" })
    }).finally(() => {
      initPromiseRef.current = null
    })

    return initPromiseRef.current
  }, [ensureWorker, status.isReady])

  useEffect(() => {
    return () => {
      worker.current?.terminate()
      worker.current = null
      initResolverRef.current = null
      initPromiseRef.current = null
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

  return {
    isReady: status.isReady,
    hasStarted: status.hasStarted,
    isInitializing: status.isInitializing,
    progress: status.progress,
    error: status.error,
    initSemanticSearch,
    generateEmbedding,
  }
}
