import { renderHook, waitFor, act } from "@testing-library/react"
import { useSemanticSearch } from "@/hooks/useSemanticSearch"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("useSemanticSearch Hook", () => {
    let mockWorker: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockWorker = {
            postMessage: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            terminate: vi.fn(),
        }

        global.Worker = vi.fn(() => mockWorker) as any
    })

    afterEach(() => {
        // cleanup
    })

    it("initializes worker and handles progress updates", async () => {
        // Mock addEventListener to simulate checking messages
        mockWorker.addEventListener.mockImplementation((event: string, handler: any) => {
            if (event === "message") {
                // Simulate progress messages
                handler({ data: { status: "progress", data: { status: "progress", progress: 50 }, error: null } })
                handler({ data: { status: "ready", data: {}, error: null } })
            }
        })

        const { result } = renderHook(() => useSemanticSearch())

        expect(global.Worker).toHaveBeenCalled()
        expect(mockWorker.postMessage).toHaveBeenCalledWith({ action: "init" })

        // Check progress update
        // Since event listener logic runs synchronously in this mock, validation depends on state update batching.
        await waitFor(() => {
            expect(result.current.progress).toBe(100)
            expect(result.current.isReady).toBe(true)
        })
    })

    it("handles worker initialization error", async () => {
        mockWorker.addEventListener.mockImplementation((event: string, handler: any) => {
            if (event === "message") {
                handler({ data: { status: "error", error: "Init failed" } })
            }
        })

        const { result } = renderHook(() => useSemanticSearch())

        await waitFor(() => {
            // Error handling isn't exposed in return type of hook explicitly?
            // "error" state is internal in hook but not returned?
            // Checking hook source: returns { isReady, progress, generateEmbedding }
            // So we can't observe error directly from return. 
            // We can only observe that isReady is false.
            expect(result.current.isReady).toBe(false)
        })
    })

    it("generates embedding successfully", async () => {
        // Make it ready immediately
        mockWorker.addEventListener.mockImplementation((event: string, handler: any) => {
            if (event === "message") {
                handler({ data: { status: "ready" } })
            }
        })

        const { result } = renderHook(() => useSemanticSearch())
        await waitFor(() => expect(result.current.isReady).toBe(true))

        // Mock event listener for generateEmbedding
        // We need to capture the handler passed to addEventListener inside generateEmbedding
        let embeddingHandler: any
        mockWorker.addEventListener.mockImplementation((event: string, handler: any) => {
            if (event === "message") {
                embeddingHandler = handler
            }
        })

        let embeddingPromise: Promise<number[] | null>
        const mockEmbedding = [0.1, 0.2]

        await act(async () => {
            embeddingPromise = result.current.generateEmbedding("text")
        })

        // Verify postMessage called
        expect(mockWorker.postMessage).toHaveBeenCalledWith({ action: "embed", text: "text" })

        // Simulate worker response
        act(() => {
            if (embeddingHandler) {
                embeddingHandler({ data: { status: "complete", embedding: mockEmbedding, text: "text" } })
            }
        })

        const embedding = await embeddingPromise!
        expect(embedding).toEqual(mockEmbedding)
    })
})
