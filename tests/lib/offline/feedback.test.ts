import { describe, it, expect, vi, beforeEach } from "vitest"
import { normalizeOfflineFeedbackPayload, queueFeedback, syncPendingFeedback } from "@/lib/offline/feedback"
import { getOfflineDB } from "@/lib/offline/db"
import { logger } from "@/lib/logger"

// Mock the DB module
vi.mock("@/lib/offline/db", () => ({
  getOfflineDB: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

describe("Offline Feedback", () => {
  const mockDb = {
    put: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOfflineDB).mockResolvedValue(mockDb as never)

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

  describe("normalizeOfflineFeedbackPayload", () => {
    it("removes empty optional fields before local queue storage or replay", () => {
      expect(
        normalizeOfflineFeedbackPayload({
          category_searched: "",
          feedback_type: "helpful_yes",
          message: " ",
          service_id: " service-1 ",
        })
      ).toEqual({
        feedback_type: "helpful_yes",
        service_id: "service-1",
      })
    })

    it("rejects payloads that would fail the public feedback API schema", () => {
      expect(() =>
        normalizeOfflineFeedbackPayload({
          category_searched: "Unsupported",
          feedback_type: "not_found",
          message: "x".repeat(1001),
        })
      ).toThrow("Invalid offline feedback payload")
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

    it("does not store locally queued feedback that fails API-schema validation", async () => {
      await expect(
        queueFeedback({
          category_searched: "Unsupported",
          feedback_type: "not_found",
        })
      ).rejects.toThrow("Invalid offline feedback payload")

      expect(mockDb.put).not.toHaveBeenCalled()
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

    it("normalizes legacy empty optional fields before replaying pending feedback", async () => {
      const pendingItems = [
        {
          category_searched: "",
          id: 1,
          feedback_type: "helpful_yes",
          message: "",
          service_id: "s1",
          syncAttempts: 0,
        },
      ]
      mockDb.getAll.mockResolvedValue(pendingItems)

      await syncPendingFeedback()

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const requestBody = fetchCall?.[1] && "body" in fetchCall[1] ? fetchCall[1].body : undefined

      expect(fetchCall?.[0]).toBe("/api/v1/feedback")
      expect(JSON.parse(String(requestBody))).toEqual({
        feedback_type: "helpful_yes",
        service_id: "s1",
      })
      expect(mockDb.delete).toHaveBeenCalledWith("pendingFeedback", 1)
    })

    it("increments sync attempts on API failure", async () => {
      const item = { id: 1, feedback_type: "helpful_yes", syncAttempts: 0 }
      mockDb.getAll.mockResolvedValue([item])

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })

      await syncPendingFeedback()

      expect(mockDb.put).toHaveBeenCalledWith(
        "pendingFeedback",
        expect.objectContaining({
          id: 1,
          syncAttempts: 1,
        })
      )
      expect(mockDb.delete).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith("[Sync] Feedback API rejected pending item", {
        action: "retained",
        feedbackType: "helpful_yes",
        id: 1,
        status: 503,
      })
    })

    it("gives up and deletes after 5 failed attempts", async () => {
      const item = { id: 1, feedback_type: "helpful_yes", syncAttempts: 5 }
      mockDb.getAll.mockResolvedValue([item])

      global.fetch = vi.fn().mockResolvedValue({ ok: false })

      await syncPendingFeedback()

      expect(mockDb.delete).toHaveBeenCalledWith("pendingFeedback", 1)
      expect(mockDb.put).not.toHaveBeenCalled()
    })

    it("does not replay invalid pending feedback payloads", async () => {
      const item = {
        category_searched: "Unsupported",
        id: 1,
        feedback_type: "not_found",
        message: "raw sensitive queued details",
        syncAttempts: 0,
      }
      mockDb.getAll.mockResolvedValue([item])

      await syncPendingFeedback()

      expect(global.fetch).not.toHaveBeenCalled()
      expect(mockDb.put).toHaveBeenCalledWith(
        "pendingFeedback",
        expect.objectContaining({
          id: 1,
          syncAttempts: 1,
        })
      )
      expect(logger.warn).toHaveBeenCalledWith("[Sync] Failed to sync feedback item", {
        action: "retained",
        errorType: "Error",
        feedbackType: "not_found",
        id: 1,
      })
      expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain("raw sensitive queued details")
    })
  })
})
