import { renderHook, waitFor, act } from "@testing-library/react"
import { useSemanticSearch } from "@/hooks/useSemanticSearch"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("useSemanticSearch Hook", () => {
  let mockWorker: any
  let messageHandlers: Array<(event: MessageEvent) => void>
  let errorHandlers: Array<(event: ErrorEvent) => void>

  beforeEach(() => {
    vi.clearAllMocks()
    messageHandlers = []
    errorHandlers = []

    mockWorker = {
      postMessage: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (event: MessageEvent | ErrorEvent) => void) => {
        if (event === "message") {
          messageHandlers.push(handler as (event: MessageEvent) => void)
        }

        if (event === "error") {
          errorHandlers.push(handler as (event: ErrorEvent) => void)
        }
      }),
      removeEventListener: vi.fn((event: string, handler: (event: MessageEvent | ErrorEvent) => void) => {
        if (event === "message") {
          messageHandlers = messageHandlers.filter((current) => current !== handler)
        }

        if (event === "error") {
          errorHandlers = errorHandlers.filter((current) => current !== handler)
        }
      }),
      terminate: vi.fn(),
    }

    global.Worker = vi.fn(() => mockWorker) as any
  })

  afterEach(() => {
    // cleanup
  })

  it("initializes worker and handles progress updates", async () => {
    mockWorker.postMessage.mockImplementation(({ action }: { action: string }) => {
      if (action === "init") {
        for (const handler of messageHandlers) {
          handler({ data: { status: "progress", data: { status: "progress", progress: 50 }, error: null } } as any)
          handler({ data: { status: "ready", data: {}, error: null } } as any)
        }
      }
    })

    const { result } = renderHook(() => useSemanticSearch())

    expect(global.Worker).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.initSemanticSearch()
    })

    await waitFor(() => {
      expect(result.current.progress).toBe(100)
      expect(result.current.isReady).toBe(true)
      expect(result.current.hasStarted).toBe(true)
    })

    expect(global.Worker).toHaveBeenCalled()
    expect(mockWorker.postMessage).toHaveBeenCalledWith({ action: "init" })
  })

  it("handles worker initialization error", async () => {
    mockWorker.postMessage.mockImplementation(({ action }: { action: string }) => {
      if (action === "init") {
        for (const handler of messageHandlers) {
          handler({ data: { status: "error", error: "Init failed" } } as any)
        }
      }
    })

    const { result } = renderHook(() => useSemanticSearch())

    await act(async () => {
      await expect(result.current.initSemanticSearch()).rejects.toThrow("Init failed")
    })

    await waitFor(() => {
      expect(result.current.isReady).toBe(false)
      expect(result.current.error).toBe("Init failed")
    })
  })

  it("generates embedding successfully", async () => {
    const mockEmbedding = [0.1, 0.2]

    mockWorker.postMessage.mockImplementation(({ action, text }: { action: string; text?: string }) => {
      if (action === "init") {
        for (const handler of messageHandlers) {
          handler({ data: { status: "ready" } } as any)
        }
      }

      if (action === "embed") {
        for (const handler of messageHandlers) {
          handler({ data: { status: "complete", embedding: mockEmbedding, text } } as any)
        }
      }
    })

    const { result } = renderHook(() => useSemanticSearch())
    await act(async () => {
      await result.current.initSemanticSearch()
    })

    await waitFor(() => expect(result.current.isReady).toBe(true))

    let embeddingPromise: Promise<number[] | null>
    await act(async () => {
      embeddingPromise = result.current.generateEmbedding("text")
    })

    expect(mockWorker.postMessage).toHaveBeenCalledWith({ action: "embed", text: "text" })
    const embedding = await embeddingPromise!
    expect(embedding).toEqual(mockEmbedding)
  })
})
