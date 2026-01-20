import { describe, it, expect, vi, beforeEach } from "vitest"
import { queueFeedback, syncPendingFeedback } from "@/lib/offline/feedback"
import { getOfflineDB } from "@/lib/offline/db"

// Mock the DB module
vi.mock("@/lib/offline/db", () => ({
  getOfflineDB: vi.fn(),
}))

describe("Offline Feedback", () => {
  const mockDb = {
    put: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getOfflineDB as any).mockResolvedValue(mockDb)

    // Mock navigator.onLine
    Object.defineProperty(global.navigator, "onLine", {
      value: true,
      configurable: true,
    })

    // Mock global fetch for API calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  describe("queueFeedback", () => {
    it("puts feedback item into IndexedDB", async () => {
      const feedback = {
        feedback_type: "helpful_yes" as const,
        service_id: "service-1",
        message: "Great!",
      }

      await queueFeedback(feedback)

      expect(mockDb.put).toHaveBeenCalledWith(
        "pendingFeedback",
        expect.objectContaining({
          feedback_type: "helpful_yes",
          service_id: "service-1",
          message: "Great!",
          createdAt: expect.any(String),
          syncAttempts: 0,
        })
      )
    })
  })

  describe("syncPendingFeedback", () => {
    it("does nothing if offline", async () => {
      Object.defineProperty(global.navigator, "onLine", { value: false })
      await syncPendingFeedback()
      expect(mockDb.getAll).not.toHaveBeenCalled()
    })

    it("syncs pending items to API and deletes from DB on success", async () => {
      const pendingItems = [
        { id: 1, feedback_type: "helpful_yes", service_id: "s1", syncAttempts: 0 },
        { id: 2, feedback_type: "issue", message: "Error", syncAttempts: 1 },
      ]
      mockDb.getAll.mockResolvedValue(pendingItems)

      await syncPendingFeedback()

      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(mockDb.delete).toHaveBeenCalledWith("pendingFeedback", 1)
      expect(mockDb.delete).toHaveBeenCalledWith("pendingFeedback", 2)
    })

    it("increments sync attempts on API failure", async () => {
      const item = { id: 1, feedback_type: "helpful_yes", syncAttempts: 0 }
      mockDb.getAll.mockResolvedValue([item])

      global.fetch = vi.fn().mockResolvedValue({ ok: false })

      await syncPendingFeedback()

      expect(mockDb.put).toHaveBeenCalledWith(
        "pendingFeedback",
        expect.objectContaining({
          id: 1,
          syncAttempts: 1,
        })
      )
      expect(mockDb.delete).not.toHaveBeenCalled()
    })

    it("gives up and deletes after 5 failed attempts", async () => {
      const item = { id: 1, feedback_type: "helpful_yes", syncAttempts: 5 }
      mockDb.getAll.mockResolvedValue([item])

      global.fetch = vi.fn().mockResolvedValue({ ok: false })

      await syncPendingFeedback()

      expect(mockDb.delete).toHaveBeenCalledWith("pendingFeedback", 1)
      expect(mockDb.put).not.toHaveBeenCalled()
    })
  })
})
