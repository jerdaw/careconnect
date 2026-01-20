import { NextRequest } from "next/server"
import { createApiError, handleApiError, createApiResponse } from "@/lib/api-utils"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * GET /api/v1/analytics
 *
 * Authenticated endpoint for partners to fetch analytics for their services.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return createApiError("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get("service_id")
    const days = Math.min(parseInt(searchParams.get("days") || "30", 10), 90)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 1. Get user's organization IDs
    const { data: userOrgs } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)

    const allowedOrgIds = (userOrgs || []).map((o) => o.organization_id)

    if (allowedOrgIds.length === 0) {
      return createApiResponse({ data: [] })
    }

    // 2. Fetch analytics only for services owned by these organizations
    let query = supabase
      .from("analytics_events")
      .select(
        `
        service_id, 
        event_type, 
        created_at,
        services!inner(org_id)
      `
      )
      .gte("created_at", startDate.toISOString())
      .in("services.org_id", allowedOrgIds)

    if (serviceId) {
      query = query.eq("service_id", serviceId)
    }

    const { data: events, error } = await query

    if (error) {
      return createApiError("Database query failed", 500, error.message)
    }

    const aggregated: Record<string, { views: number; clicks: number }> = {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const event of (events || []) as any[]) {
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

    const data = Object.entries(aggregated).map(([id, stats]) => ({
      service_id: id,
      views: stats.views,
      clicks: stats.clicks,
      period_days: days,
    }))

    return createApiResponse(data)
  } catch (err) {
    return handleApiError(err)
  }
}
