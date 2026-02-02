import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"

export async function POST(req: NextRequest) {
  try {
    const { endpoint } = (await req.json()) as { endpoint: string }

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await withCircuitBreaker(async () =>
      supabase.from("push_subscriptions").delete().eq("endpoint", endpoint)
    )

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unsubscribe server error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
