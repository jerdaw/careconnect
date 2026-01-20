import { exec } from "child_process"
import util from "util"
import { handleApiError, createApiResponse, createApiError } from "@/lib/api-utils"
import { assertAdminRole } from "@/lib/auth/authorization"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const execPromise = util.promisify(exec)

export async function POST() {
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

    await assertAdminRole(supabase, user.id)

    // Run the existing script
    // Note: This relies on the system having the environment set up correctly
    await execPromise("npm run generate-embeddings")

    // Audit Log
    await supabase.from("audit_logs").insert({
      table_name: "embeddings",
      record_id: "global",
      operation: "UPDATE",
      performed_by: user.id,
      metadata: { action: "reindex" },
    })

    return createApiResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
