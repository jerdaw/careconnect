import { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import {
  AuthorizationError,
  createApiResponse,
  createApiError,
  handleApiError,
  validateContentType,
} from "@/lib/api-utils"
import { assertPermission } from "@/lib/auth/authorization"
import { logger } from "@/lib/logger"
import { ServiceCreateSchema } from "@/lib/schemas/service-create"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { env } from "@/lib/env"
import { mapCreateInputToServiceInsert } from "@/lib/service-db"

/**
 * GET /api/v1/services
 *
 * Public endpoint to list services with optional filters.
 *
 * Query Params:
 *   - q: Search query (optional)
 *   - category: Filter by intent_category (optional)
 *   - limit: Max results (default 20, max 100)
 *   - offset: Pagination offset (default 0)
 *
 * Response:
 *   - 200: { data: Service[], total: number, limit: number, offset: number }
 *   - 429: Rate limit exceeded
 *   - 500: { error: string }
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 100 requests per minute per IP
  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimit(clientIp, 100, 60 * 1000, "api:v1:services:list")

  if (!rateLimit.success) {
    const response = createApiError("Rate limit exceeded. Try again later.", 429)
    response.headers.set("X-RateLimit-Remaining", "0")
    response.headers.set("X-RateLimit-Reset", rateLimit.reset.toString())
    response.headers.set("Retry-After", Math.ceil((rateLimit.reset * 1000 - Date.now()) / 1000).toString())
    return response
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const category = searchParams.get("category")
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100)
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  try {
    let query = supabase
      .from("services")
      .select(
        "id, name, name_fr, description, description_fr, address, address_fr, phone, url, email, hours, category, verification_status",
        { count: "exact" }
      )

    // Apply category filter
    if (category) {
      query = query.eq("category", category)
    }

    // Apply search filter (basic text search)
    if (q) {
      // SECURITY: Escape ILIKE wildcards to prevent query manipulation
      const escapeIlike = (value: string) => value.replace(/[%_\\]/g, "\\$&")
      const safeQ = escapeIlike(q)
      // Search in name, description (case-insensitive)
      query = query.or(
        `name.ilike.%${safeQ}%,description.ilike.%${safeQ}%,name_fr.ilike.%${safeQ}%,description_fr.ilike.%${safeQ}%`
      )
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await withCircuitBreaker(async () => query)

    if (error) {
      logger.error("API /v1/services error:", error.message, {
        component: "api-v1-services",
        action: "GET",
        category,
      })
      return createApiError("Database query failed", 500)
    }

    // Set cache headers for CDN
    const response = createApiResponse(data || [], {
      meta: {
        total: count || 0,
        limit,
        offset: offset + (data?.length || 0), // Next offset hint
      },
    })

    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")

    return response
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * POST /api/v1/services
 *
 * Protected endpoint to create a new service within the authenticated user's organization.
 * Requires: Valid session cookie, organization membership, and canCreateServices permission.
 */
export async function POST(request: NextRequest) {
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
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return createApiError("Unauthorized", 401)
    }

    // Parse and validate body
    validateContentType(request)
    const json = await request.json()
    const validation = ServiceCreateSchema.safeParse(json)

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      return createApiError(`Validation failed: ${errors}`, 400)
    }

    const body = validation.data

    const { data: membership, error: membershipError } = await withCircuitBreaker(async () =>
      supabaseAuth.from("organization_members").select("organization_id").eq("user_id", user.id).single()
    )

    const organizationId = membership?.organization_id

    if (membershipError || !organizationId) {
      throw new AuthorizationError("You are not a member of an organization")
    }

    if (body.org_id && body.org_id !== organizationId) {
      throw new AuthorizationError("Cannot create services for another organization")
    }

    await assertPermission(supabaseAuth, user.id, organizationId, "canCreateServices")

    // Add server-managed fields
    const serviceData = mapCreateInputToServiceInsert(body, {
      id: crypto.randomUUID(),
      orgId: organizationId,
      verifiedBy: user.id,
      verificationStatus: "L1",
      published: false,
    })

    // Insert with circuit breaker protection
    const { data, error } = await withCircuitBreaker(async () =>
      supabaseAuth.from("services").insert(serviceData).select().single()
    )

    if (error) {
      logger.error("API /v1/services POST error:", error, {
        component: "api-v1-services",
        action: "POST",
        user: user.id,
      })
      return createApiError("Failed to create service", 500, error.message)
    }

    return createApiResponse(data, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
