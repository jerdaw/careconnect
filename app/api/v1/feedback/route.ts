import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { FeedbackSubmitSchema } from "@/types/feedback"

// Rate limit storage
const globalWithRateLimit = global as typeof globalThis & {
  feedbackRateLimit?: Map<string, number[]>
}

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

    // 2. Rate Limiting (In-memory basic implementation)
    const ip = request.headers.get("x-forwarded-for") || "anonymous"
    const now = Date.now()
    const rateLimitWindow = 3600000 // 1 hour
    const maxRequests = 10

    // Simple in-memory cleanup (could be moved to a separate utility/middleware)
    // For a solo-dev/low-traffic project, this is sufficient without Redis.
    if (!globalWithRateLimit.feedbackRateLimit) {
      globalWithRateLimit.feedbackRateLimit = new Map()
    }

    const userRequests = globalWithRateLimit.feedbackRateLimit.get(ip) || []
    const recentRequests = userRequests.filter((time: number) => now - time < rateLimitWindow)

    if (recentRequests.length >= maxRequests) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "3600",
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex",
          },
        }
      )
    }

    recentRequests.push(now)
    globalWithRateLimit.feedbackRateLimit.set(ip, recentRequests)

    // 3. Insert into Supabase
    const supabase = await createClient()

    // Note: 'service_id' is optional (e.g. for global 'not_found' feedback).
    // If it's provided, assurance it exists is handled by Foreign Key in DB (will throw if invalid).

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from("feedback") as any).insert([
      {
        service_id: service_id || null,
        feedback_type,
        message: message || null,
        category_searched: category_searched || null,
        status: "pending",
      },
    ])

    if (insertError) {
      console.error("Supabase Error submitting feedback:", insertError)
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
    console.error("Unexpected error in feedback route:", err)
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
  }
}
