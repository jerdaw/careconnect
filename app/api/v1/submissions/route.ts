import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"
import { checkRateLimit, createRateLimitHeaders, getClientIp } from "@/lib/rate-limit"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { SubmissionSchema } from "@/types/submission"

function nullableString(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, message: "Invalid submission data" }, { status: 400 })
    }

    const validation = SubmissionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid submission data", errors: validation.error.flatten() },
        { status: 400 }
      )
    }

    const rateLimit = await checkRateLimit(getClientIp(request), 10, 60 * 60 * 1000, "api:v1:submissions:create")
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

    const submission = validation.data
    const supabase = await createClient()
    const { error } = await withCircuitBreaker(async () =>
      supabase.from("service_submissions").insert([
        {
          name: submission.name,
          description: submission.description,
          phone: nullableString(submission.phone),
          url: nullableString(submission.url),
          address: nullableString(submission.address),
          submitted_by_email: nullableString(submission.submitted_by_email),
          status: "pending",
        },
      ])
    )

    if (error) {
      logger.error("Supabase error submitting service suggestion", error, {
        component: "api-submissions",
        action: "POST",
      })
      return NextResponse.json(
        { success: false, message: "Failed to save submission" },
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
      { success: true, message: "Submission received" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex",
        },
      }
    )
  } catch (err) {
    logger.error("Unexpected error in submissions route", err, {
      component: "api-submissions",
      action: "POST",
    })
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
  }
}
