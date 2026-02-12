/**
 * Performance Metrics API Endpoint
 *
 * Returns aggregated performance metrics for monitoring and debugging.
 * Protected endpoint - requires authentication.
 * In production: Admin-only access.
 * In development/staging: Any authenticated user.
 *
 * @route GET /api/v1/metrics
 */

import { NextRequest, NextResponse } from "next/server"
import { getMetrics, getOperationMetrics, getRawDataPoints } from "@/lib/performance/metrics"
import { env } from "@/lib/env"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isUserAdmin } from "@/lib/auth/authorization"

/**
 * Check if request is authenticated and get user
 */
async function getAuthenticatedUser(): Promise<{ authenticated: boolean; userId: string | null }> {
  try {
    const { createServerClient } = await import("@supabase/ssr")
    const { cookies } = await import("next/headers")

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
    } = await supabaseAuth.auth.getUser()

    return {
      authenticated: !!user,
      userId: user?.id || null,
    }
  } catch {
    return {
      authenticated: false,
      userId: null,
    }
  }
}

/**
 * GET /api/v1/metrics
 *
 * Query params:
 *   - operation: Filter to specific operation (e.g., "search.total")
 *   - raw: Include raw data points (default: false)
 *   - limit: Limit raw data points (default: 100, max: 1000)
 *
 * Response:
 *   - 200: Metrics data
 *   - 401: Unauthorized
 *   - 403: Forbidden (requires admin in production)
 *   - 404: Performance tracking disabled
 *   - 429: Rate limit exceeded
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 30 requests per minute per IP
  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimit(clientIp, 30, 60 * 1000)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimit.reset.toString(),
          "Retry-After": Math.ceil((rateLimit.reset * 1000 - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  // Authentication check
  const { authenticated, userId } = await getAuthenticatedUser()
  if (!authenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Production: Require admin access
  if (env.NODE_ENV === "production") {
    const { createServerClient } = await import("@supabase/ssr")
    const { cookies } = await import("next/headers")

    const cookieStore = await cookies()
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL || "",
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const isAdmin = await isUserAdmin(supabase, userId)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required in production" }, { status: 403 })
    }
  }

  // Check if performance tracking is enabled
  if (!env.NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING) {
    return NextResponse.json(
      {
        error: "Performance tracking is disabled",
        hint: "Set NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=true to enable",
      },
      { status: 404 }
    )
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const operation = searchParams.get("operation")
  const includeRaw = searchParams.get("raw") === "true"
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 1000)

  try {
    // Single operation query
    if (operation) {
      const operationMetrics = getOperationMetrics(operation)

      if (!operationMetrics) {
        return NextResponse.json({ error: `No metrics found for operation: ${operation}` }, { status: 404 })
      }

      const response: Record<string, unknown> = {
        operation: operationMetrics,
      }

      // Include raw data points if requested
      if (includeRaw) {
        response.rawDataPoints = getRawDataPoints(operation, limit)
      }

      return NextResponse.json(response, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json",
        },
      })
    }

    // All metrics query
    const allMetrics = getMetrics()

    const response: Record<string, unknown> = {
      summary: {
        totalOperations: allMetrics.totalOperations,
        trackingSince: allMetrics.trackingSince,
        trackingDurationMs: Date.now() - allMetrics.trackingSince,
        operationCount: Object.keys(allMetrics.operations).length,
      },
      operations: allMetrics.operations,
    }

    // Include raw data if requested (for all operations)
    if (includeRaw) {
      const rawData: Record<string, unknown> = {}
      for (const op of Object.keys(allMetrics.operations)) {
        rawData[op] = getRawDataPoints(op, limit)
      }
      response.rawDataPoints = rawData
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to retrieve metrics",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/metrics
 *
 * Reset all metrics.
 * In production: Admin-only access.
 * In development/staging: Any authenticated user.
 *
 * Response:
 *   - 200: Metrics reset successfully
 *   - 401: Unauthorized
 *   - 403: Forbidden (requires admin in production)
 */
export async function DELETE() {
  // Authentication check
  const { authenticated, userId } = await getAuthenticatedUser()
  if (!authenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Production: Require admin access
  if (env.NODE_ENV === "production") {
    const { createServerClient } = await import("@supabase/ssr")
    const { cookies } = await import("next/headers")

    const cookieStore = await cookies()
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL || "",
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const isAdmin = await isUserAdmin(supabase, userId)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required in production" }, { status: 403 })
    }
  }

  try {
    const { resetMetrics } = await import("@/lib/performance/metrics")
    resetMetrics()

    return NextResponse.json({
      success: true,
      message: "Metrics reset successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to reset metrics",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
