import { NextRequest } from "next/server"
import { env } from "@/lib/env"
import { getPublicAppUrl } from "@/lib/brand"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { handleApiError, createApiResponse, createApiError, validateContentType } from "@/lib/api-utils"
import { assertAdminRole } from "@/lib/auth/authorization"
import { logger } from "@/lib/logger"
import type { Database } from "@/types/supabase"
import { z } from "zod"

const pushTargetSchema = z.enum(["all", "subscribed_all", "active_users", "new_users"])

const dateStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")

const pushRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(2000),
    url: z.string().trim().url().optional(),
    type: z.string().trim().min(1).max(100).optional(),
    target: pushTargetSchema.optional().default("all"),
    filters: z
      .object({
        createdAfter: dateStringSchema.optional(),
        createdBefore: dateStringSchema.optional(),
        minSessions: z.number().int().min(1).max(100000).optional(),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.filters?.createdAfter &&
      value.filters?.createdBefore &&
      Date.parse(value.filters.createdAfter) > Date.parse(value.filters.createdBefore)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["filters", "createdAfter"],
        message: "createdAfter must be earlier than createdBefore",
      })
    }
  })

/**
 * Build OneSignal targeting filters based on target type and custom filters
 */
function buildOneSignalFilters(
  target: string,
  filters?: {
    createdAfter?: string
    createdBefore?: string
    minSessions?: number
  }
): {
  included_segments?: string[]
  filters?: Array<Record<string, string | number>>
} {
  // For simple segment-based targeting
  switch (target) {
    case "all":
      return { included_segments: ["All"] }
    case "subscribed_all":
      return { included_segments: ["Subscribed Users"] }
    case "active_users":
      return { included_segments: ["Active Users"] }
    default:
      break
  }

  // For filter-based targeting
  const oneSignalFilters: Array<Record<string, string | number>> = []

  // Add time-based filters
  if (filters?.createdAfter) {
    oneSignalFilters.push({
      field: "first_session",
      relation: ">",
      value: new Date(filters.createdAfter).getTime() / 1000,
    })
  }

  if (filters?.createdBefore) {
    oneSignalFilters.push({
      field: "first_session",
      relation: "<",
      value: new Date(filters.createdBefore).getTime() / 1000,
    })
  }

  // Add session count filter
  if (filters?.minSessions) {
    oneSignalFilters.push({
      field: "session_count",
      relation: ">",
      value: filters.minSessions,
    })
  }

  // If we have custom filters, use them; otherwise fall back to "All"
  if (oneSignalFilters.length > 0) {
    return { filters: oneSignalFilters }
  }

  return { included_segments: ["All"] }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Readonly in API route
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return createApiError("Unauthorized", 401)
    }

    // Phase 1.3: Strict admin check
    await assertAdminRole(supabase, user.id)

    validateContentType(request)

    const validation = pushRequestSchema.safeParse(await request.json())
    if (!validation.success) {
      return createApiError("Invalid push payload", 400, validation.error.flatten())
    }

    const { title, message, url, type, target, filters } = validation.data

    if (!env.ONESIGNAL_REST_API_KEY || !env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      return createApiError("OneSignal not configured", 500)
    }

    // 3. Build OneSignal targeting based on selected target and filters
    const oneSignalFilters = buildOneSignalFilters(target, filters)

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
        url: url || getPublicAppUrl(),
        // Use segments or filters based on target
        ...(oneSignalFilters.included_segments
          ? { included_segments: oneSignalFilters.included_segments }
          : { filters: oneSignalFilters.filters }),
        data: {
          type: type || "general",
          url: url || "/",
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return createApiError("OneSignal API Error", response.status, errorData)
    }

    const result = (await response.json()) as { id: string }
    const auditWarnings: string[] = []

    // 4. Log to notification audit table
    const { error: notificationAuditError } = await supabase.from("notification_audit").insert({
      title,
      message,
      notification_type: type,
      onesignal_id: result.id,
      sent_by: user.id,
      sent_at: new Date().toISOString(),
    })
    if (notificationAuditError) {
      auditWarnings.push("notification_audit")
      logger.error("Push notification audit insert failed", notificationAuditError, {
        component: "api-admin-push",
        action: "POST",
        notificationId: result.id,
      })
    }

    // 5. Log to Unified Audit Table (Phase 1.3)
    const { error: auditLogError } = await supabase.from("audit_logs").insert({
      table_name: "notifications",
      record_id: result.id,
      operation: "CREATE",
      performed_by: user.id,
      metadata: { title, type },
    })
    if (auditLogError) {
      auditWarnings.push("audit_logs")
      logger.error("Unified push audit insert failed", auditLogError, {
        component: "api-admin-push",
        action: "POST",
        notificationId: result.id,
      })
    }

    // 6. Admin Actions Log (Phase 3)
    const { error: adminActionError } = await supabase.rpc("log_admin_action", {
      p_action: "push_notification",
      p_performed_by: user.id,
      p_details: {
        title,
        message,
        target,
        notification_id: result.id,
        has_filters: !!filters,
      },
    })
    if (adminActionError) {
      auditWarnings.push("admin_actions")
      logger.error("Admin action log failed for push notification", adminActionError, {
        component: "api-admin-push",
        action: "POST",
        notificationId: result.id,
      })
    }

    return createApiResponse({
      success: true,
      notificationId: result.id,
      auditStatus: auditWarnings.length === 0 ? "ok" : "degraded",
      warnings: auditWarnings,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
