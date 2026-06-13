import { getOfflineDB, PendingFeedback } from "./db"
import { logger } from "@/lib/logger"
import { FeedbackSubmitSchema, type FeedbackSubmitPayload } from "@/types/feedback"

export type OfflineFeedbackQueueInput = Pick<
  PendingFeedback,
  "category_searched" | "feedback_type" | "message" | "service_id"
>

type OfflineFeedbackDB = Awaited<ReturnType<typeof getOfflineDB>>

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (value === undefined) return undefined

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function getFeedbackSyncErrorType(error: unknown): string {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name || "DOMException"
  }

  if (error instanceof Error) {
    return "Error"
  }

  return typeof error
}

export function normalizeOfflineFeedbackPayload(feedback: OfflineFeedbackQueueInput): FeedbackSubmitPayload {
  const candidate: Record<string, unknown> = {
    feedback_type: feedback.feedback_type,
  }
  const serviceId = normalizeOptionalString(feedback.service_id)
  const message = normalizeOptionalString(feedback.message)
  const categorySearched = normalizeOptionalString(feedback.category_searched)

  if (serviceId !== undefined) candidate.service_id = serviceId
  if (message !== undefined) candidate.message = message
  if (categorySearched !== undefined) candidate.category_searched = categorySearched

  const result = FeedbackSubmitSchema.safeParse(candidate)
  if (!result.success) {
    throw new Error("Invalid offline feedback payload")
  }

  return result.data
}

async function recordFeedbackSyncFailure(
  db: OfflineFeedbackDB,
  item: PendingFeedback
): Promise<"deleted" | "retained" | "skipped"> {
  if (item.id === undefined) return "skipped"

  const updated = { ...item, syncAttempts: (item.syncAttempts || 0) + 1 }
  if (updated.syncAttempts > 5) {
    await db.delete("pendingFeedback", item.id)
    return "deleted"
  }

  await db.put("pendingFeedback", updated)
  return "retained"
}

/**
 * Queue a feedback submission to IndexedDB
 */
export async function queueFeedback(feedback: OfflineFeedbackQueueInput) {
  const payload = normalizeOfflineFeedbackPayload(feedback)
  const db = await getOfflineDB()
  await db.put("pendingFeedback", {
    ...payload,
    createdAt: new Date().toISOString(),
    syncAttempts: 0,
  })
  logger.info("[Offline] Feedback queued for sync", { feedbackType: payload.feedback_type })
}

/**
 * Attempt to sync all pending feedback
 */
export async function syncPendingFeedback() {
  if (typeof window === "undefined") return

  // Check network
  if (!navigator.onLine) return

  try {
    const db = await getOfflineDB()
    const pending = await db.getAll("pendingFeedback")

    if (pending.length === 0) return

    logger.info("[Sync] Found pending feedback items", { count: pending.length })

    for (const item of pending) {
      try {
        // Attempt submission to API
        const payload = normalizeOfflineFeedbackPayload(item)

        const response = await fetch("/api/v1/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          // Cleanup on success
          if (item.id !== undefined) await db.delete("pendingFeedback", item.id)
        } else {
          const action = await recordFeedbackSyncFailure(db, item)
          logger.warn("[Sync] Feedback API rejected pending item", {
            action,
            feedbackType: item.feedback_type,
            id: item.id,
            status: response.status,
          })
        }
      } catch (err) {
        const action = await recordFeedbackSyncFailure(db, item)
        logger.warn("[Sync] Failed to sync feedback item", {
          action,
          errorType: getFeedbackSyncErrorType(err),
          feedbackType: item.feedback_type,
          id: item.id,
        })
      }
    }
  } catch (error) {
    logger.warn("[Sync] Error accessing offline DB for feedback", {
      errorType: getFeedbackSyncErrorType(error),
    })
  }
}
