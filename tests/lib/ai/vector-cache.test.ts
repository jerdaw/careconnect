import { describe, it, expect, vi, beforeEach } from "vitest"
import { VectorCache } from "@/lib/ai/vector-cache"
import { openDB } from "idb"

// Mock idb
const mockDB = {
    get: vi.fn(),
    put: vi.fn(),
    clear: vi.fn(),
    createObjectStore: vi.fn().mockReturnValue({ createIndex: vi.fn() })
}

vi.mock("idb", () => ({
    openDB: vi.fn()
}))

describe("VectorCache", () => {
    beforeEach(() => {
        vi.clearAllMocks()
            ; (openDB as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue(mockDB)
    })

    it("initializes DB on client side", async () => {
        new VectorCache()
        // Wait for potential promise handling if exposed, but constructor is synchronous init of promise
        // We can check if openDB was called
        expect(openDB).toHaveBeenCalledWith("kcc-vector-store", 1, expect.any(Object))
    })

    it("sets value in cache", async () => {
        const cache = new VectorCache()
        await cache.set("test-id", [0.1], { meta: "data" })

        expect(mockDB.put).toHaveBeenCalledWith("vectors", expect.objectContaining({
            id: "test-id",
            embedding: [0.1],
            metadata: { meta: "data" }
        }))
    })

    it("gets value from cache", async () => {
        const cache = new VectorCache()
        mockDB.get.mockResolvedValue({ id: "test-id", embedding: [0.1] })

        const result = await cache.get("test-id")
        expect(mockDB.get).toHaveBeenCalledWith("vectors", "test-id")
        expect(result).toEqual({ id: "test-id", embedding: [0.1] })
    })

    it("clears cache", async () => {
        const cache = new VectorCache()
        await cache.clear()
        expect(mockDB.clear).toHaveBeenCalledWith("vectors")
    })
})
