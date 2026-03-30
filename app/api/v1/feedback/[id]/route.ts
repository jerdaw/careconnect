import { NextRequest } from "next/server"
import { z } from "zod"
import { createApiError, handleApiError, createApiResponse, validateContentType } from "@/lib/api-utils"
import { assertServiceOwnership } from "@/lib/auth/authorization"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { env } from "@/lib/env"
import { checkRateLimit, createRateLimitHeaders, getClientIp } from "@/lib/rate-limit"
import type { Database } from "@/types/supabase"

const UpdateStatusSchema = z.object({
  status: z.enum(["pending", "reviewed", "resolved", "dismissed"]),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: feedbackId } = await params
    const rateLimit = await checkRateLimit(getClientIp(request), 60, 60 * 1000, "api:v1:feedback:update")
    if (!rateLimit.success) {
      return createApiError(
        "Too many requests. Please try again later.",
        429,
        undefined,
        createRateLimitHeaders(rateLimit)
      )
    }

    const cookieStore = await cookies()
    const supabaseAuth = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL || "",
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return createApiError("Unauthorized", 401)
    }

    validateContentType(request)
    const body = await request.json()
    const validation = UpdateStatusSchema.safeParse(body)

    if (!validation.success) {
      return createApiError("Invalid status", 400)
    }

    const { status } = validation.data

    // 1. Get feedback and verify ownership
    const { data: feedbackData, error: feedbackError } = await withCircuitBreaker(async () =>
      supabaseAuth.from("feedback").select("service_id").eq("id", feedbackId).single()
    )

    if (feedbackError || !feedbackData) {
      return createApiError("Feedback not found", 404)
    }

    if (!feedbackData.service_id) {
      return createApiError("Feedback is not linked to a service", 400)
    }

    await assertServiceOwnership(supabaseAuth, user.id, feedbackData.service_id)

    // 2. Update Status
    const { error: updateError } = await withCircuitBreaker(async () =>
      supabaseAuth
        .from("feedback")
        .update({
          status: status,
          resolved_at: status === "resolved" ? new Date().toISOString() : null,
          resolved_by: user.email,
        })
        .eq("id", feedbackId)
    )

    if (updateError) {
      return createApiError("Failed to update feedback", 500, updateError.message)
    }

    return createApiResponse({ success: true, message: "Feedback updated" })
  } catch (error) {
    return handleApiError(error)
  }
}
