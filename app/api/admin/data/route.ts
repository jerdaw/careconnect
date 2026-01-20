import { NextRequest } from "next/server"
import path from "path"
import fs from "fs/promises"
import { handleApiError, createApiResponse, createApiError } from "@/lib/api-utils"
import { assertAdminRole } from "@/lib/auth/authorization"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(_request: Request) {
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return createApiError("Unauthorized", 401)

    await assertAdminRole(supabase, user.id)

    const dataPath = path.join(process.cwd(), "data", "services.json")
    const fileContents = await fs.readFile(dataPath, "utf8")
    const services = JSON.parse(fileContents)
    return createApiResponse({ services })
  } catch (err) {
    return handleApiError(err)
  }
}
