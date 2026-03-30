import { NextRequest } from "next/server"
import { createApiError, handleApiError, createApiResponse, validateContentType } from "@/lib/api-utils"
import { assertServiceOwnership } from "@/lib/auth/authorization"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { env } from "@/lib/env"
import { ServiceUpdateSubmitSchema } from "@/types/feedback"
import { checkRateLimit, createRateLimitHeaders, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: serviceId } = await params
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
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

    // 1. Verify Ownership before allowing update request
    // This prevents any user from submitting requests for services they don't own.
    // If they want to submit a public correction, they should use the /feedback route (which is open for insert).
    await assertServiceOwnership(supabaseAuth, user.id, serviceId)

    validateContentType(request)
    const body = await request.json()
    const validation = ServiceUpdateSubmitSchema.safeParse(body)

    if (!validation.success) {
      return createApiError("Invalid update data", 400, validation.error.flatten())
    }

    const rateLimit = await checkRateLimit(getClientIp(request), 20, 60 * 60 * 1000, "api:v1:services:update-request")
    if (!rateLimit.success) {
      return createApiError(
        "Too many requests. Please try again later.",
        429,
        undefined,
        createRateLimitHeaders(rateLimit)
      )
    }

    const { field_updates, justification } = validation.data

    const { error } = await withCircuitBreaker(async () =>
      supabaseAuth.from("service_update_requests").insert({
        service_id: serviceId,
        requested_by: user.email ?? user.id,
        field_updates,
        justification,
        status: "pending",
      })
    )

    if (error) {
      return createApiError("Failed to submit update request", 500, error.message)
    }

    return createApiResponse({ success: true, message: "Update request submitted" })
  } catch (err) {
    return handleApiError(err)
  }
}
