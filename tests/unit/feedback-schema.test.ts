import { describe, it, expect } from "vitest"
import { FeedbackSubmitSchema } from "@/types/feedback"

describe("FeedbackSubmitSchema", () => {
  it("validates a simple helpful_yes vote", () => {
    const payload = {
      service_id: "service-123",
      feedback_type: "helpful_yes",
    }
    const result = FeedbackSubmitSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it("validates an issue report with a message", () => {
    const payload = {
      service_id: "service-123",
      feedback_type: "issue",
      message: "The phone number is disconnected.",
    }
    const result = FeedbackSubmitSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it("validates a not_found report with category", () => {
    const payload = {
      feedback_type: "not_found",
      category_searched: "Food",
      message: "Looking for a food bank near downtown.",
    }
    const result = FeedbackSubmitSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it("fails if feedback_type is invalid", () => {
    const payload = {
      service_id: "service-123",
      feedback_type: "invalid_type",
    }
    const result = FeedbackSubmitSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it("fails if message is too long", () => {
    const payload = {
      service_id: "service-123",
      feedback_type: "issue",
      message: "a".repeat(1001),
    }
    const result = FeedbackSubmitSchema.safeParse(payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error?.errors[0]?.message).toBe("Message must be 1000 characters or less")
    }
  })

  it("fails if category_searched is invalid", () => {
    const payload = {
      feedback_type: "not_found",
      category_searched: "InvalidCategory",
    }
    const result = FeedbackSubmitSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })
})
