import { NextRequest } from "next/server"
import path from "path"
import fs from "fs/promises"
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
    const body = (await req.json()) as { service: { id: string } }
    const { service } = body
    if (!service || !service.id) {
      return createApiError("Invalid data", 400)
    }

    const dataPath = path.join(process.cwd(), "data", "services.json")
    const fileContents = await fs.readFile(dataPath, "utf8")
    const services = JSON.parse(fileContents) as { id: string }[]

    const oldService = services.find((s: { id: string }) => s.id === service.id)

    // Update or Add
    const index = services.findIndex((s: { id: string }) => s.id === service.id)
    if (index > -1) {
      services[index] = service
    } else {
      services.push(service)
    }

    // Write back
    await fs.writeFile(dataPath, JSON.stringify(services, null, 2))

    // Audit Log
    await supabase.from("audit_logs").insert({
      table_name: "services_json",
      record_id: service.id,
      operation: index > -1 ? "UPDATE" : "CREATE",
      old_data: oldService,
      new_data: service,
      performed_by: user.id,
    })

    return createApiResponse({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
