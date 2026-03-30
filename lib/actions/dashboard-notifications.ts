"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { createClient } from "@/utils/supabase/server"

const MarkNotificationSchema = z.object({
  notificationId: z.string().uuid(),
  locale: z.string().min(1),
})

const MarkAllNotificationsSchema = z.object({
  locale: z.string().min(1),
})

type NotificationActionResult = {
  success: boolean
  error?: string
}

type AuthenticatedUserResult =
  | {
      supabase: Awaited<ReturnType<typeof createClient>>
      user: NonNullable<
        Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>>["data"]["user"]
      >
      error: null
    }
  | { supabase: null; user: null; error: string }

async function requireAuthenticatedUser(): Promise<AuthenticatedUserResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase: null, user: null, error: "Unauthorized" }
  }

  return { supabase, user, error: null }
}

export async function markNotificationReadAction(input: unknown): Promise<NotificationActionResult> {
  const validation = MarkNotificationSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Invalid notification id" }
  }

  const auth = await requireAuthenticatedUser()
  if (!auth.supabase || !auth.user) {
    return { success: false, error: auth.error }
  }

  const { notificationId, locale } = validation.data
  const { error } = await auth.supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", auth.user.id)

  if (error) {
    logger.error("Failed to mark notification as read", error, {
      component: "DashboardNotificationActions",
      action: "markNotificationRead",
      notificationId,
      userId: auth.user.id,
    })
    return { success: false, error: error.message }
  }

  revalidatePath(`/${locale}/dashboard/notifications`)
  return { success: true }
}

export async function markAllNotificationsReadAction(input: unknown): Promise<NotificationActionResult> {
  const validation = MarkAllNotificationsSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Invalid locale" }
  }

  const auth = await requireAuthenticatedUser()
  if (!auth.supabase || !auth.user) {
    return { success: false, error: auth.error }
  }

  const { locale } = validation.data
  const { error } = await auth.supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", auth.user.id)
    .eq("read", false)

  if (error) {
    logger.error("Failed to mark all notifications as read", error, {
      component: "DashboardNotificationActions",
      action: "markAllNotificationsRead",
      userId: auth.user.id,
    })
    return { success: false, error: error.message }
  }

  revalidatePath(`/${locale}/dashboard/notifications`)
  return { success: true }
}
