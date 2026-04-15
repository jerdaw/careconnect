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
  const requestIdRef = useRef(0)
  const pendingEmbeddingResolversRef = useRef(
    new Map<number, { resolve: (value: number[] | null) => void; cleanup: () => void }>()
  )
  const [status, setStatus] = useState<WorkerStatus>({
    isReady: false,
    hasStarted: false,
    isInitializing: false,
    progress: null,
    error: null,
  })

  const handleWorkerFailure = useCallback((message: string, options?: { rejectInit?: boolean }) => {
    setStatus((prev) => ({
      ...prev,
      isReady: false,
      hasStarted: true,
      isInitializing: false,
      error: message,
    }))

    if (options?.rejectInit) {
      initResolverRef.current?.reject(new Error(message))
      initResolverRef.current = null
    }

    for (const { resolve, cleanup } of pendingEmbeddingResolversRef.current.values()) {
      cleanup()
      resolve(null)
    }
    pendingEmbeddingResolversRef.current.clear()
  }, [])

  const ensureWorker = useCallback(() => {
    if (worker.current) {
      return worker.current
    }

    const nextWorker = new Worker(new URL("../app/worker.ts", import.meta.url))

    nextWorker.addEventListener("message", (event) => {
      const { status: eventStatus, data, error, requestId } = event.data

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

      if (eventStatus === "error" && requestId === undefined) {
        const message = typeof error === "string" ? error : "Failed to load model"
        logger.error("Worker Error:", message, { component: "useSemanticSearch" })
        handleWorkerFailure(message, { rejectInit: true })
      }
    })

    nextWorker.addEventListener("error", (event) => {
      const message = `Worker Error: ${event.message}`
      logger.error("Worker Script Error:", event.message, { component: "useSemanticSearch" })
      handleWorkerFailure(message, { rejectInit: true })
    })

    worker.current = nextWorker
    return nextWorker
  }, [handleWorkerFailure])

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
    const pendingEmbeddingResolvers = pendingEmbeddingResolversRef.current

    return () => {
      worker.current?.terminate()
      worker.current = null
      initResolverRef.current = null
      initPromiseRef.current = null
      pendingEmbeddingResolvers.clear()
    }
  }, [])

  const generateEmbedding = useCallback(
    (text: string): Promise<number[] | null> => {
      return new Promise((resolve) => {
        if (!worker.current || !status.isReady) {
          resolve(null)
          return
        }

        const currentWorker = worker.current
        const requestId = requestIdRef.current++

        const handler = (event: MessageEvent) => {
          const { status, embedding, error, requestId: responseRequestId, text: responseText } = event.data
          if (responseRequestId !== requestId || responseText !== text) {
            return
          }

          const pendingRequest = pendingEmbeddingResolversRef.current.get(requestId)
          pendingRequest?.cleanup()
          pendingEmbeddingResolversRef.current.delete(requestId)

          if (status === "complete") {
            resolve(embedding)
            return
          }

          if (status === "error") {
            const message = typeof error === "string" ? error : "Failed to generate embedding"
            logger.error("Worker embedding error", message, { component: "useSemanticSearch" })
            handleWorkerFailure(message)
            resolve(null)
          }
        }

        pendingEmbeddingResolversRef.current.set(requestId, {
          resolve,
          cleanup: () => currentWorker.removeEventListener("message", handler),
        })
        currentWorker.addEventListener("message", handler)
        currentWorker.postMessage({ action: "embed", text, requestId })
      })
    },
    [handleWorkerFailure, status.isReady]
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
