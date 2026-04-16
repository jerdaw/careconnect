import { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { createApiResponse, createApiError, handleApiError, validateContentType } from "@/lib/api-utils"
import { assertServiceOwnership } from "@/lib/auth/authorization"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { env } from "@/lib/env"
import {
  getDirectServiceWriteUnsupportedFields,
  mapPartnerServiceEditToServiceUpdate,
  PartnerServiceEditSchema,
} from "@/lib/schemas/service-partner-edit"

/**
 * GET /api/v1/services/[id]
 *
 * Public endpoint to get a single service by ID.
 *
 * Response:
 *   - 200: { data: Service }
 *   - 404: { error: "Service not found" }
 *   - 500: { error: string }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!id) {
    return createApiError("Service ID is required", 400)
  }

  try {
    // Query the public view (accessible by anon users) instead of the protected services table
    const { data, error } = await withCircuitBreaker(async () =>
      supabase.from("services_public").select("*").eq("id", id).single()
    )

    if (error || !data) {
      return createApiError("Service not found", 404)
    }

    const response = createApiResponse(data)

    // Cache individual service for 5 minutes
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")

    return response
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * PUT /api/v1/services/[id]
 *
 * Protected endpoint to update a service.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Verify ownership and permissions
    await assertServiceOwnership(supabaseAuth, user.id, id)

    validateContentType(request)
    const validation = PartnerServiceEditSchema.safeParse(await request.json())
    if (!validation.success) {
      return createApiError("Invalid service update payload", 400, validation.error.flatten())
    }

    const unsupportedFields = getDirectServiceWriteUnsupportedFields(validation.data)
    if (unsupportedFields.length > 0) {
      return createApiError("Unsupported direct update fields", 400, {
        unsupportedFields,
      })
    }

    const updates = mapPartnerServiceEditToServiceUpdate(validation.data)

    const { data, error } = await withCircuitBreaker(async () =>
      supabaseAuth.from("services").update(updates).eq("id", id).select().single()
    )

    if (error) {
      return createApiError("Failed to update service", 500, error.message)
    }

    return createApiResponse(data)
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * PATCH /api/v1/services/[id]
 *
 * Protected endpoint for partial updates.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Verify ownership and permissions
    await assertServiceOwnership(supabaseAuth, user.id, id)

    validateContentType(request)
    const validation = PartnerServiceEditSchema.safeParse(await request.json())
    if (!validation.success) {
      return createApiError("Invalid service update payload", 400, validation.error.flatten())
    }

    const unsupportedFields = getDirectServiceWriteUnsupportedFields(validation.data)
    if (unsupportedFields.length > 0) {
      return createApiError("Unsupported direct update fields", 400, {
        unsupportedFields,
      })
    }

    const updates = mapPartnerServiceEditToServiceUpdate(validation.data)

    const { data, error } = await withCircuitBreaker(async () =>
      supabaseAuth.from("services").update(updates).eq("id", id).select().single()
    )

    if (error) {
      return createApiError("Failed to patch service", 500, error.message)
    }

    return createApiResponse(data)
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * DELETE /api/v1/services/[id]
 *
 * Protected endpoint to delete a service.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Verify ownership and permissions - restricted to admin/owner
    await assertServiceOwnership(supabaseAuth, user.id, id, ["owner", "admin"])

    // Soft delete with circuit breaker protection
    const { error } = await withCircuitBreaker(async () =>
      supabaseAuth
        .from("services")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq("id", id)
    )

    if (error) {
      return createApiError("Failed to delete service", 500, error.message)
    }

    return createApiResponse({ success: true, message: "Service deleted (archived)" })
  } catch (err) {
    return handleApiError(err)
  }
}
