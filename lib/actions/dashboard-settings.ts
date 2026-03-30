"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { assertPermission } from "@/lib/auth/authorization"
import { logger } from "@/lib/logger"
import type { RolePermissions } from "@/lib/rbac"
import type { Database } from "@/types/supabase"
import { createClient } from "@/utils/supabase/server"

const emptyStringToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

const OrganizationUpdateSchema = z.object({
  organizationId: z.string().uuid(),
  locale: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  domain: z.preprocess(emptyStringToNull, z.string().trim().max(255).nullable()),
})

const OrganizationSettingsSchema = z.object({
  organizationId: z.string().uuid(),
  locale: z.string().min(1),
  website: z.preprocess(emptyStringToNull, z.string().trim().url().nullable()),
  phone: z.preprocess(emptyStringToNull, z.string().trim().max(50).nullable()),
  description: z.preprocess(emptyStringToNull, z.string().trim().max(2000).nullable()),
  email_on_feedback: z.boolean(),
  email_on_service_update: z.boolean(),
  weekly_analytics_report: z.boolean(),
})

type DashboardActionResult = {
  success: boolean
  error?: string
}

type OrganizationPermissionResult =
  | {
      supabase: Awaited<ReturnType<typeof createClient>>
      user: NonNullable<
        Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>>["data"]["user"]
      >
      error: null
    }
  | { supabase: null; user: null; error: string }

async function requireOrganizationPermission(
  orgId: string,
  permission: keyof RolePermissions
): Promise<OrganizationPermissionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase: null, user: null, error: "Unauthorized" }
  }

  try {
    await assertPermission(supabase, user.id, orgId, permission)
  } catch (error) {
    logger.warn("Dashboard settings permission denied", {
      component: "DashboardSettingsActions",
      action: permission,
      orgId,
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    })
    return { supabase: null, user: null, error: "Unauthorized" }
  }

  return { supabase, user, error: null }
}

export async function updateOrganizationAction(input: unknown): Promise<DashboardActionResult> {
  const validation = OrganizationUpdateSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Invalid organization data" }
  }

  const { organizationId, locale, name, domain } = validation.data
  const auth = await requireOrganizationPermission(organizationId, "canEditOrganization")
  if (!auth.supabase || auth.error) {
    return { success: false, error: auth.error }
  }

  const { error } = await auth.supabase.from("organizations").update({ name, domain }).eq("id", organizationId)

  if (error) {
    logger.error("Failed to update organization", error, {
      component: "DashboardSettingsActions",
      action: "updateOrganization",
      organizationId,
    })
    return { success: false, error: error.message }
  }

  revalidatePath(`/${locale}/dashboard/settings`)
  return { success: true }
}

export async function upsertOrganizationSettingsAction(input: unknown): Promise<DashboardActionResult> {
  const validation = OrganizationSettingsSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Invalid organization settings" }
  }

  const payload = validation.data
  const auth = await requireOrganizationPermission(payload.organizationId, "canManageSettings")
  if (!auth.supabase || auth.error) {
    return { success: false, error: auth.error }
  }

  const settingsInsert: Database["public"]["Tables"]["organization_settings"]["Insert"] = {
    organization_id: payload.organizationId,
    website: payload.website,
    phone: payload.phone,
    description: payload.description,
    email_on_feedback: payload.email_on_feedback,
    email_on_service_update: payload.email_on_service_update,
    weekly_analytics_report: payload.weekly_analytics_report,
    updated_at: new Date().toISOString(),
  }

  const { error } = await auth.supabase
    .from("organization_settings")
    .upsert(settingsInsert, { onConflict: "organization_id" })

  if (error) {
    logger.error("Failed to upsert organization settings", error, {
      component: "DashboardSettingsActions",
      action: "upsertSettings",
      organizationId: payload.organizationId,
    })
    return { success: false, error: error.message }
  }

  revalidatePath(`/${payload.locale}/dashboard/settings`)
  return { success: true }
}
