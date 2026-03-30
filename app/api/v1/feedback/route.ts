import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { FeedbackSubmitSchema } from "@/types/feedback"
import { logger } from "@/lib/logger"
import { checkRateLimit, createRateLimitHeaders, getClientIp } from "@/lib/rate-limit"
import { submitFeedback } from "@/lib/feedback/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 1. Validate Input
    const validationResult = FeedbackSubmitSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, message: "Invalid feedback data", errors: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { service_id, feedback_type, message, category_searched } = validationResult.data

    // Preserve the current public feedback throttle: 10 requests per hour per client IP.
    const rateLimit = await checkRateLimit(getClientIp(request), 10, 60 * 60 * 1000, "api:v1:feedback:create")
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex",
            ...createRateLimitHeaders(rateLimit),
          },
        }
      )
    }

    // 3. Insert into Supabase
    const supabase = await createClient()

    // Note: 'service_id' is optional (e.g. for global 'not_found' feedback).
    // If it's provided, assurance it exists is handled by Foreign Key in DB (will throw if invalid).

    const { error: insertError } = await submitFeedback(supabase, {
      service_id: service_id || null,
      feedback_type,
      message: message || null,
      category_searched: category_searched || null,
      status: "pending",
    })

    if (insertError) {
      logger.error("Supabase error submitting feedback", insertError, {
        component: "api-feedback",
        action: "POST",
      })
      return NextResponse.json(
        { success: false, message: "Failed to save feedback" },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex",
          },
        }
      )
    }

    return NextResponse.json(
      { success: true, message: "Feedback received" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex",
        },
      }
    )
  } catch (err) {
    logger.error("Unexpected error in feedback route", err, {
      component: "api-feedback",
      action: "POST",
    })
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
  }
}
