import { NextRequest } from "next/server"
import { env } from "@/lib/env"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { handleApiError, createApiResponse, createApiError, validateContentType } from "@/lib/api-utils"
import { assertAdminRole } from "@/lib/auth/authorization"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Readonly in API route
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return createApiError("Unauthorized", 401)
    }

    // Phase 1.3: Strict admin check
    await assertAdminRole(supabase, user.id)

    validateContentType(request)

    // 2. Validate request
    const body = (await request.json()) as { title: string; message: string; url?: string; type?: string }
    const { title, message, url, type } = body

    if (!title || !message) {
      return createApiError("Missing title or message", 400)
    }

    if (!env.ONESIGNAL_REST_API_KEY || !env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      return createApiError("OneSignal not configured", 500)
    }

    // 3. Call OneSignal REST API
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        contents: { en: message },
        headings: { en: title },
        url: url || "https://kingstoncareconnect.org",
        included_segments: ["All"], // Send to everyone
        data: {
          type: type || "general",
          url: url || "/",
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return createApiError("OneSignal API Error", response.status, errorData)
    }

    const result = (await response.json()) as { id: string }

    // 4. Log to Legacy Audit Table
    await supabase.from("notification_audit").insert({
      title,
      message,
      notification_type: type,
      onesignal_id: result.id,
      sent_by: user.id,
      sent_at: new Date().toISOString(),
    })

    // 5. Log to Unified Audit Table (Phase 1.3)
    await supabase.from("audit_logs").insert({
      table_name: "notifications",
      record_id: result.id,
      operation: "CREATE",
      performed_by: user.id,
      metadata: { title, type },
    })

    return createApiResponse({ success: true, notificationId: result.id })
  } catch (err) {
    return handleApiError(err)
  }
}
