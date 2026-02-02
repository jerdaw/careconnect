/**
 * Health Check API Endpoint
 *
 * Returns system health status including circuit breaker state,
 * database connectivity, and performance metrics.
 *
 * Public Access: Basic status (healthy/degraded/unhealthy)
 * Detailed Metrics: Requires authentication or development mode
 *
 * @route GET /api/v1/health
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseBreakerStats } from "@/lib/resilience/supabase-breaker"
import { supabase } from "@/lib/supabase"
import { getMetrics } from "@/lib/performance/metrics"
import { env } from "@/lib/env"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

/**
 * Health check response structure
 */
interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  version: string
  checks: {
    database: {
      status: "up" | "down" | "degraded"
      latencyMs?: number
      error?: string
    }
    circuitBreaker: {
      enabled: boolean
      state: string
      stats: ReturnType<typeof getSupabaseBreakerStats>
    }
    performance?: {
      tracking: boolean
      metrics: ReturnType<typeof getMetrics>
    }
  }
}

/**
 * Check database connectivity and latency
 */
async function checkDatabase(): Promise<HealthCheckResponse["checks"]["database"]> {
  try {
    const startTime = performance.now()

    // Simple connectivity check - query system health
    const { error } = await supabase.from("services").select("id").limit(1)

    const latencyMs = Math.round(performance.now() - startTime)

    if (error) {
      return {
        status: "down",
        latencyMs,
        error: error.message,
      }
    }

    // Degraded if latency > 1000ms
    if (latencyMs > 1000) {
      return {
        status: "degraded",
        latencyMs,
      }
    }

    return {
      status: "up",
      latencyMs,
    }
  } catch (error) {
    return {
      status: "down",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Check if request is authenticated
 */
async function isAuthenticated(): Promise<boolean> {
  try {
    const { createServerClient } = await import("@supabase/ssr")
    const { cookies } = await import("next/headers")

    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
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
    } = await supabaseAuth.auth.getUser()

    return !!user
  } catch {
    return false
  }
}

/**
 * GET /api/v1/health
 *
 * Returns system health status.
 * Basic status is public (for load balancers).
 * Detailed metrics require authentication or development mode.
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 10 requests per minute per IP
  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimit(clientIp, 10, 60 * 1000)

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

  const timestamp = new Date().toISOString()
  const version = process.env.npm_package_version || "unknown"

  // Check database health
  const databaseCheck = await checkDatabase()

  // Get circuit breaker status
  const circuitBreakerStats = getSupabaseBreakerStats()

  // Determine overall health status
  let overallStatus: HealthCheckResponse["status"] = "healthy"

  if (databaseCheck.status === "down" || circuitBreakerStats.state === "OPEN") {
    overallStatus = "unhealthy"
  } else if (databaseCheck.status === "degraded") {
    overallStatus = "degraded"
  }

  // Check if request should get detailed metrics
  // Use process.env.NODE_ENV directly to avoid server-only env variable access issues
  const isDevelopment = process.env.NODE_ENV === "development"
  const authenticated = await isAuthenticated()
  const showDetails = isDevelopment || authenticated

  // Basic response (always public)
  const basicResponse = {
    status: overallStatus,
    timestamp,
    version,
  }

  // If not authorized for details, return basic response
  if (!showDetails) {
    const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503

    return NextResponse.json(basicResponse, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json",
      },
    })
  }

  // Get performance metrics (only when tracking enabled and authorized)
  const performanceMetrics = env.NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING ? getMetrics() : undefined

  // Detailed response (authenticated or development)
  const detailedResponse: HealthCheckResponse = {
    ...basicResponse,
    checks: {
      database: databaseCheck,
      circuitBreaker: {
        enabled: circuitBreakerStats.enabled,
        state: circuitBreakerStats.state,
        stats: circuitBreakerStats,
      },
      ...(performanceMetrics && {
        performance: {
          tracking: true,
          metrics: performanceMetrics,
        },
      }),
    },
  }

  // Set appropriate status code
  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503

  return NextResponse.json(detailedResponse, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json",
    },
  })
}
