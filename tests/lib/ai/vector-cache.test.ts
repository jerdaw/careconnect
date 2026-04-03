import { describe, it, expect, vi, beforeEach } from "vitest"
import { VectorCache } from "@/lib/ai/vector-cache"
import { LEGACY_BRAND_KEYS } from "@/lib/legacy-brand"
import { openDB } from "idb"

// Mock idb
const mockDB = {
  objectStoreNames: {
    contains: vi.fn((name: string) => name === "vectors"),
  },
  get: vi.fn(),
  getAll: vi.fn().mockResolvedValue([]),
  put: vi.fn(),
  clear: vi.fn(),
  createObjectStore: vi.fn().mockReturnValue({ createIndex: vi.fn() }),
  close: vi.fn(),
  transaction: vi.fn(() => ({
    store: { put: vi.fn() },
    done: Promise.resolve(),
  })),
}

vi.mock("idb", () => ({
  openDB: vi.fn(),
}))

describe("VectorCache", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(openDB as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue(mockDB)
  })

  it("initializes DBs on client side", async () => {
    new VectorCache()
    expect(openDB).toHaveBeenCalledWith(LEGACY_BRAND_KEYS.vectorDbNames[0], 1)
    expect(openDB).toHaveBeenCalledWith("careconnect-vector-store", 1, expect.any(Object))
  })

  it("sets value in cache", async () => {
    const cache = new VectorCache()
    await cache.set("test-id", [0.1], { meta: "data" })

    expect(mockDB.put).toHaveBeenCalledWith(
      "vectors",
      expect.objectContaining({
        id: "test-id",
        embedding: [0.1],
        metadata: { meta: "data" },
      })
    )
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
