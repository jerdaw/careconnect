import { NextRequest } from "next/server"
import { z } from "zod"
import { createApiError, handleApiError, createApiResponse, validateContentType } from "@/lib/api-utils"
import { assertServiceOwnership } from "@/lib/auth/authorization"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const UpdateRequestSchema = z.object({
  field_updates: z.record(z.any()),
  justification: z.string().max(500).optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: serviceId } = await params
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
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return createApiError("Unauthorized", 401)
    }

    // 1. Verify Ownership before allowing update request
    // This prevents any user from submitting requests for services they don't own.
    // If they want to submit a public correction, they should use the /feedback route (which is open for insert).
    await assertServiceOwnership(supabaseAuth, user.id, serviceId)

    validateContentType(request)
    const body = await request.json()
    const validation = UpdateRequestSchema.safeParse(body)

    if (!validation.success) {
      return createApiError("Invalid update data", 400, validation.error.flatten())
    }

    const { field_updates, justification } = validation.data

    const { error } = await supabaseAuth.from("service_update_requests").insert({
      service_id: serviceId,
      requested_by: user.email,
      field_updates,
      justification,
      status: "pending",
    })

    if (error) {
      return createApiError("Failed to submit update request", 500, error.message)
    }

    return createApiResponse({ success: true, message: "Update request submitted" })
  } catch (err) {
    return handleApiError(err)
  }
}
