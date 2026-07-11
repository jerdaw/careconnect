import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { logger } from "@/lib/logger"
import { checkRateLimit, createRateLimitHeaders, getClientIp } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
      }
      throw error
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    }

    const { endpoint } = body as { endpoint: string }

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    }

    const rateLimit = await checkRateLimit(getClientIp(req), 20, 60 * 60 * 1000, "api:v1:notifications:unsubscribe")
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: createRateLimitHeaders(rateLimit) }
      )
    }

    const supabase = await createClient()

    const { error } = await withCircuitBreaker(async () =>
      supabase.from("push_subscriptions").delete().eq("endpoint", endpoint)
    )

    if (error) {
      logger.error("Database error during unsubscribe", error, {
        component: "api-notifications-unsubscribe",
        action: "POST",
      })
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Unsubscribe server error", err, {
      component: "api-notifications-unsubscribe",
      action: "POST",
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
