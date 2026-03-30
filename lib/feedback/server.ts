import type { SupabaseClient } from "@supabase/supabase-js"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import type { Database } from "@/types/supabase"

export type FeedbackInsertPayload = Pick<
  Database["public"]["Tables"]["feedback"]["Insert"],
  "service_id" | "feedback_type" | "message" | "category_searched" | "description" | "status"
>

export type LegacyFeedbackType = "wrong_phone" | "wrong_address" | "service_closed" | "other"

export async function submitFeedback(supabase: SupabaseClient<Database>, payload: FeedbackInsertPayload) {
  return withCircuitBreaker(async () => supabase.from("feedback").insert([payload]))
}

export function mapLegacyFeedbackPayload(input: {
  serviceId: string
  feedbackType: LegacyFeedbackType
  message?: string
}): FeedbackInsertPayload {
  return {
    service_id: input.serviceId,
    feedback_type: "issue",
    description: input.feedbackType,
    message: input.message?.trim() || null,
    status: "pending",
  }
}
