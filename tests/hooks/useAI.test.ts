import { renderHook, act } from "@testing-library/react"
import { useAI } from "@/hooks/useAI"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { aiEngine } from "@/lib/ai/engine"

vi.mock("@/lib/ai/engine", () => ({
    aiEngine: {
        subscribe: vi.fn(),
        init: vi.fn(),
        chat: vi.fn(),
    },
}))

describe("useAI Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks()
            // Mock subscribe to call the callback immediately with initial state
            ; (aiEngine.subscribe as any).mockImplementation((cb: any) => {
                cb({ isLoading: false, progress: 0, text: "Ready", isReady: true, error: null })
                return vi.fn() // unsubscribe
            })
    })

    it("subscribes to engine state on mount", () => {
        const { result } = renderHook(() => useAI())
        expect(aiEngine.subscribe).toHaveBeenCalled()
        expect(result.current.isReady).toBe(true)
        expect(result.current.text).toBe("Ready")
    })

    it("initializes AI", () => {
        const { result } = renderHook(() => useAI())

        act(() => {
            result.current.initAI()
        })
        expect(aiEngine.init).toHaveBeenCalled()
    })

    it("sends chat message", async () => {
        ; (aiEngine.chat as any).mockResolvedValue("Response")
        const { result } = renderHook(() => useAI())

        await act(async () => {
            const resp = await result.current.chat([{ role: "user", content: "Hello" }])
            expect(resp).toBe("Response")
        })

        expect(aiEngine.chat).toHaveBeenCalledWith([{ role: "user", content: "Hello" }])
    })
})
