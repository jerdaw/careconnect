import { FeedbackRecord } from "@/types/feedback"

/**
 * Centralized test fixtures for Feedback objects.
 * Following the roadmap recommendation for improved test maintainability.
 */

// Standard feedback submission
export const mockFeedback: FeedbackRecord = {
  id: "test-feedback-1",
  service_id: "test-service-l3",
  feedback_type: "issue",
  message: "The phone number listed is incorrect.",
  category_searched: null,
  status: "pending",
  resolved_at: null,
  resolved_by: null,
  created_at: new Date("2026-01-19T00:00:00Z").toISOString(),
}

// Feedback awaiting triage
export const mockPendingFeedback: FeedbackRecord = {
  id: "test-feedback-pending",
  service_id: "test-service-l1",
  feedback_type: "issue",
  message: "Service hours have changed.",
  category_searched: null,
  status: "pending",
  resolved_at: null,
  resolved_by: null,
  created_at: new Date("2026-01-18T00:00:00Z").toISOString(),
}

// Reviewed/Resolved feedback
export const mockResolvedFeedback: FeedbackRecord = {
  id: "test-feedback-resolved",
  service_id: "test-service-l3",
  feedback_type: "issue",
  message: "Please add wheelchair accessibility information.",
  category_searched: null,
  status: "resolved",
  resolved_by: "admin-user-1",
  resolved_at: new Date("2026-01-19T14:00:00Z").toISOString(),
  created_at: new Date("2026-01-17T00:00:00Z").toISOString(),
}

// Dismissed feedback
export const mockDismissedFeedback: FeedbackRecord = {
  id: "test-feedback-dismissed",
  service_id: "test-service-l1",
  feedback_type: "issue",
  message: "This is spam.",
  category_searched: null,
  status: "dismissed",
  resolved_by: "admin-user-1",
  resolved_at: new Date("2026-01-19T09:00:00Z").toISOString(),
  created_at: new Date("2026-01-19T08:00:00Z").toISOString(),
}

// Collection of feedback for list testing
export const mockFeedbackList: FeedbackRecord[] = [mockPendingFeedback, mockResolvedFeedback, mockDismissedFeedback]

// Factory function for creating custom feedback fixtures
export const createMockFeedback = (overrides: Partial<FeedbackRecord>): FeedbackRecord => ({
  ...mockFeedback,
  id: `test-feedback-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  created_at: new Date().toISOString(),
  ...overrides,
})

// Offline queued feedback (for offline sync tests)
export const mockOfflineFeedback: FeedbackRecord = {
  id: `offline-${Date.now()}`,
  service_id: "test-service-l1",
  feedback_type: "issue",
  message: "Submitted while offline.",
  category_searched: null,
  status: "pending",
  resolved_at: null,
  resolved_by: null,
  created_at: new Date().toISOString(),
}

// Feedback with different types
export const mockHelpfulFeedback: FeedbackRecord = {
  ...mockFeedback,
  id: "test-feedback-helpful",
  feedback_type: "helpful_yes",
  message: "Great service!",
}

export const mockNotFoundFeedback: FeedbackRecord = {
  ...mockFeedback,
  id: "test-feedback-missing",
  feedback_type: "not_found",
  category_searched: "Food",
  message: "Couldn't find food banks nearby.",
}
