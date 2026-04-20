/**
 * Health Check API Endpoint
 *
 * Public Access: Basic status (healthy/degraded/unhealthy)
 * Detailed Metrics: Requires admin access in production or development mode
 * Side effects: none. Public traffic must not mutate SLO state or trigger alerts.
 *
 * @route GET /api/v1/health
 */

import { NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/env"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isUserAdmin } from "@/lib/auth/authorization"
import { getHealthSnapshot } from "@/lib/observability/health-check"
import { hasSupabaseCredentials } from "@/lib/supabase"

async function getAuthenticatedUser(): Promise<{ authenticated: boolean; userId: string | null }> {
  try {
    if (!hasSupabaseCredentials()) {
      return {
        authenticated: false,
        userId: null,
      }
    }

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

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimit(clientIp, 10, 60 * 1000, "api:v1:health")

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

  const snapshot = await getHealthSnapshot()
  const isDevelopment = env.NODE_ENV === "development"
  const { authenticated: isAuthenticatedUser, userId } = await getAuthenticatedUser()

  let showDetails = isDevelopment || isAuthenticatedUser
  if (env.NODE_ENV === "production") {
    showDetails = false

    if (isAuthenticatedUser && userId) {
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

      showDetails = await isUserAdmin(supabaseAuth, userId)
    }
  }

  const statusCode = snapshot.overallStatus === "unhealthy" ? 503 : 200

  if (!showDetails) {
    return NextResponse.json(snapshot.basicResponse, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json",
      },
    })
  }

  return NextResponse.json(snapshot.detailedResponse, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json",
    },
  })
}
