import { NextRequest } from "next/server"
// Imports removed
import { createApiError, handleApiError, createApiResponse, validateContentType } from "@/lib/api-utils"
import { assertAdminRole } from "@/lib/auth/authorization"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
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
    } = await supabase.auth.getUser()
    if (!user) return createApiError("Unauthorized", 401)

    // Phase 1.3: Strict admin check
    await assertAdminRole(supabase, user.id)

    validateContentType(req)
    const body = (await req.json()) as { service: { id: string; name: string } }
    const { service } = body
    if (!service || !service.id) {
      return createApiError("Invalid data", 400)
    }

    // 1. Fetch current data for audit log (optional but good practice)
    const { data: oldService } = await supabase.from("services").select("*").eq("id", service.id).single()

    // 2. Transact to Supabase
    // We use upsert to create or update
    const { error: upsertError } = await supabase.from("services").upsert({
      ...service,
      last_verified: new Date().toISOString(),
    })

    if (upsertError) {
      return createApiError(`Database error: ${upsertError.message}`, 500)
    }

    // 3. Audit Log
    await supabase.from("audit_logs").insert({
      table_name: "services",
      record_id: service.id,
      operation: oldService ? "UPDATE" : "CREATE",
      old_data: oldService,
      new_data: service,
      performed_by: user.id,
    })

    return createApiResponse({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
