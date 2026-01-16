import { NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/env"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  // 1. Authenticate the admin user
  // In a real environment, we'd check if the user has the 'admin' role
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Validate request
  const body = (await request.json()) as { title: string; message: string; url?: string; type?: string }
  const { title, message, url, type } = body

  if (!title || !message) {
    return NextResponse.json({ error: "Missing title or message" }, { status: 400 })
  }

  if (!env.ONESIGNAL_REST_API_KEY || !env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
    return NextResponse.json({ error: "OneSignal not configured" }, { status: 500 })
  }

  try {
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
      return NextResponse.json({ error: "OneSignal API Error", details: errorData }, { status: response.status })
    }

    const result = (await response.json()) as { id: string }

    // 4. Log to Audit Table
    await supabase
      .from("notification_audit")
      .insert({
        title,
        message,
        notification_type: type,
        onesignal_id: result.id,
        sent_by: user.id,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    return NextResponse.json({ success: true, notificationId: result.id })
  } catch (err) {
    console.error("Failed to send push notification", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
