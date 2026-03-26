import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { NotificationCategory, type PushSubscription } from "@/types/notifications"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { logger } from "@/lib/logger"
import { checkRateLimit, createRateLimitHeaders, getClientIp } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const { subscription, categories, locale } = (await req.json()) as {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
      categories: NotificationCategory[]
      locale: string
    }

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 })
    }

    const rateLimit = await checkRateLimit(getClientIp(req), 20, 60 * 60 * 1000, "api:v1:notifications:subscribe")
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: createRateLimitHeaders(rateLimit) }
      )
    }

    const supabase = await createClient()

    // 1. Check if subscription already exists (by endpoint)
    const { data: existing } = await withCircuitBreaker(async () =>
      supabase.from("push_subscriptions").select("id").eq("endpoint", subscription.endpoint).single()
    )

    type ExistingSubscription = Pick<PushSubscription, "id"> | null
    const existingTyped = existing as ExistingSubscription

    let error

    if (existingTyped) {
      // Update existing
      const { error: updateError } = await withCircuitBreaker(async () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- push_subscriptions table not in generated Supabase types
        (supabase as any)
          .from("push_subscriptions")
          .update({
            categories,
            keys: subscription.keys, // Ensure keys are fresh
            locale,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingTyped.id)
      )
      error = updateError
    } else {
      // Insert new
      const { error: insertError } = await withCircuitBreaker(async () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- push_subscriptions table not in generated Supabase types
        (supabase as any).from("push_subscriptions").insert({
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          categories,
          locale,
        })
      )
      error = insertError
    }

    if (error) {
      logger.error("Database error during subscription", error, {
        component: "api-notifications-subscribe",
        action: "POST",
      })
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Subscribe server error", err, {
      component: "api-notifications-subscribe",
      action: "POST",
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
