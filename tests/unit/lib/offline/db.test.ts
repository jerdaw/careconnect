import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  saveAllServices,
  getAllServices,
  getServiceById,
  setMeta,
  getMeta,
  saveAllEmbeddings,
  getAllEmbeddings,
} from "@/lib/offline/db"
import { VerificationLevel, IntentCategory } from "@/types/service"

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
}))

vi.mock("idb", () => ({
  openDB: vi.fn().mockResolvedValue({
    transaction: () => ({
      store: {
        put: mocks.put,
      },
      done: Promise.resolve(),
    }),
    getAll: mocks.getAll,
    get: mocks.get,
    put: mocks.put,
  }),
}))

const mockServices = [
  {
    id: "s1",
    name: "Service 1",
    description: "Desc 1",
    verification_level: VerificationLevel.L3,
    intent_category: IntentCategory.Housing,
    status: "Active",
    last_verified: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "s2",
    name: "Service 2",
    description: "Desc 2",
    verification_level: VerificationLevel.L2,
    intent_category: IntentCategory.Food,
    status: "Active",
    last_verified: "2026-01-01",
    updated_at: "2026-01-01",
  },
]

describe("Offline DB", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.put.mockResolvedValue(undefined)
    mocks.get.mockResolvedValue(undefined)
    mocks.getAll.mockResolvedValue([])
  })

  describe("saveAllServices", () => {
    it("should call put for each service", async () => {
      await saveAllServices(mockServices as any)
      expect(mocks.put).toHaveBeenCalledTimes(mockServices.length)
      expect(mocks.put).toHaveBeenCalledWith(mockServices[0])
      expect(mocks.put).toHaveBeenCalledWith(mockServices[1])
    })
  })

  describe("getAllServices", () => {
    it("should return all services from the store", async () => {
      mocks.getAll.mockResolvedValue(mockServices)
      const result = await getAllServices()
      expect(mocks.getAll).toHaveBeenCalledWith("services")
      expect(result).toEqual(mockServices)
    })
  })

  describe("getServiceById", () => {
    it("should return a service by its ID", async () => {
      mocks.get.mockResolvedValue(mockServices[0])
      const result = await getServiceById("s1")
      expect(mocks.get).toHaveBeenCalledWith("services", "s1")
      expect(result).toEqual(mockServices[0])
    })
  })

  describe("Embeddings", () => {
    it("should save all embeddings", async () => {
      const embeddings = [{ id: "s1", embedding: [0.1, 0.2] }]
      await saveAllEmbeddings(embeddings)
      expect(mocks.put).toHaveBeenCalledWith(embeddings[0])
    })

    it("should get all embeddings", async () => {
      const embeddings = [{ id: "s1", embedding: [0.1, 0.2] }]
      mocks.getAll.mockResolvedValue(embeddings)
      const result = await getAllEmbeddings()
      expect(result).toEqual(embeddings)
    })
  })

  describe("Metadata", () => {
    it("should save metadata correctly", async () => {
      await setMeta("lastSync", "2026-01-13")
      expect(mocks.put).toHaveBeenCalledWith("meta", { id: "lastSync", value: "2026-01-13" })
    })

    it("should retrieve metadata correctly", async () => {
      mocks.get.mockResolvedValue({ id: "lastSync", value: "2026-01-13" })
      const result = await getMeta("lastSync")
      expect(mocks.get).toHaveBeenCalledWith("meta", "lastSync")
      expect(result).toBe("2026-01-13")
    })

    it("should return undefined if metadata key does not exist", async () => {
      mocks.get.mockResolvedValue(undefined)
      const result = await getMeta("none")
      expect(result).toBeUndefined()
    })
  })
})
