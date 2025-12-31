import { NextResponse, NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "@/types/supabase"

/**
 * GET /api/v1/analytics
 *
 * Authenticated endpoint for partners to fetch analytics for their services.
 *
 * Query Params:
 *   - service_id: Filter by specific service (optional)
 *   - days: Number of days to look back (default 30, max 90)
 *
 * Response:
 *   - 200: { data: AnalyticsData[] }
 *   - 401: { error: "Unauthorized" }
 *   - 500: { error: string }
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // Read-only for API route
      },
    }
  )

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const serviceId = searchParams.get("service_id")
  const days = Math.min(parseInt(searchParams.get("days") || "30", 10), 90)

  // Calculate date range
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  try {
    // For now, fetch analytics for all services (future: filter by user's org)
    let query = supabase
      .from("analytics_events")
      .select("service_id, event_type, created_at")
      .gte("created_at", startDate.toISOString())

    if (serviceId) {
      query = query.eq("service_id", serviceId)
    }

    const { data: events, error } = await query

    if (error) {
      console.error("API /v1/analytics error:", error.message)
      return NextResponse.json({ error: "Database query failed" }, { status: 500 })
    }

    // Aggregate events by service_id and event_type
    const aggregated: Record<string, { views: number; clicks: number }> = {}

    const typedEvents = (events || []) as Array<{ service_id: string | null; event_type: string | null }>
    for (const event of typedEvents) {
      if (!event.service_id) continue
      if (!aggregated[event.service_id]) {
        aggregated[event.service_id] = { views: 0, clicks: 0 }
      }

      if (event.event_type === "view_detail") {
        aggregated[event.service_id]!.views++
      } else if (event.event_type === "click_website" || event.event_type === "click_call") {
        aggregated[event.service_id]!.clicks++
      }
    }

    // Convert to array
    const data = Object.entries(aggregated).map(([id, stats]) => ({
      service_id: id,
      views: stats.views,
      clicks: stats.clicks,
      period_days: days,
    }))

    return NextResponse.json({ data })
  } catch (err) {
    console.error("API /v1/analytics unexpected error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
