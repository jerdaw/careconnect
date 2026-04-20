"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { assertPermission } from "@/lib/auth/authorization"
import { logger } from "@/lib/logger"
import type { RolePermissions } from "@/lib/rbac"
import { createClient } from "@/utils/supabase/server"

const OrganizationIdSchema = z.string().uuid()

const CreateInvitationSchema = z.object({
  organizationId: OrganizationIdSchema,
  locale: z.string().min(1),
  email: z.string().trim().email(),
  role: z.enum(["admin", "editor", "viewer"]),
})

const CancelInvitationSchema = z.object({
  invitationId: z.string().uuid(),
  locale: z.string().min(1),
})

type InvitationActionResult = {
  success: boolean
  error?: string
  token?: string
}

type InvitationListItem = {
  id: string
  email: string
  role: "admin" | "editor" | "viewer"
  invited_at: string
  expires_at: string
}

const INVITATION_ROLES = ["admin", "editor", "viewer"] as const

function isInvitationRole(role: string): role is InvitationListItem["role"] {
  return INVITATION_ROLES.includes(role as InvitationListItem["role"])
}

type InvitationPermissionResult =
  | {
      supabase: Awaited<ReturnType<typeof createClient>>
      user: NonNullable<
        Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>>["data"]["user"]
      >
      error: null
    }
  | { supabase: null; user: null; error: string }

async function requireInvitationPermission(
  orgId: string,
  permission: keyof RolePermissions
): Promise<InvitationPermissionResult> {
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
    logger.warn("Invitation permission denied", {
      component: "OrganizationInvitationActions",
      action: permission,
      orgId,
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    })
    return { supabase: null, user: null, error: "Unauthorized" }
  }

  return { supabase, user, error: null }
}

export async function listOrganizationInvitations(organizationId: string): Promise<InvitationListItem[]> {
  const validation = OrganizationIdSchema.safeParse(organizationId)
  if (!validation.success) {
    return []
  }

  const auth = await requireInvitationPermission(validation.data, "canViewMembers")
  if (!auth.supabase) {
    return []
  }

  const { data, error } = await auth.supabase
    .from("organization_invitations")
    .select("id, email, role, invited_at, expires_at")
    .eq("organization_id", validation.data)
    .is("accepted_at", null)
    .order("invited_at", { ascending: false })

  if (error || !data) {
    logger.error("Failed to list organization invitations", error, {
      component: "OrganizationInvitationActions",
      action: "listInvitations",
      organizationId: validation.data,
    })
    return []
  }

  return data.flatMap((invitation) => {
    if (!isInvitationRole(invitation.role)) {
      logger.warn("Ignoring organization invitation with unsupported role", {
        component: "OrganizationInvitationActions",
        action: "listInvitations",
        organizationId: validation.data,
        invitationId: invitation.id,
        role: invitation.role,
      })
      return []
    }

    return [
      {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        invited_at: invitation.invited_at,
        expires_at: invitation.expires_at,
      },
    ]
  })
}

export async function createOrganizationInvitation(input: unknown): Promise<InvitationActionResult> {
  const validation = CreateInvitationSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Invalid invitation data" }
  }

  const payload = validation.data
  const auth = await requireInvitationPermission(payload.organizationId, "canInviteMembers")
  if (!auth.supabase || !auth.user) {
    return { success: false, error: auth.error }
  }

  const { data: token, error: tokenError } = await auth.supabase.rpc("generate_invitation_token")
  if (tokenError || !token) {
    logger.error("Failed to generate invitation token", tokenError, {
      component: "OrganizationInvitationActions",
      action: "createInvitationToken",
      organizationId: payload.organizationId,
    })
    return { success: false, error: tokenError?.message || "Failed to generate invitation token" }
  }

  const { error } = await auth.supabase.from("organization_invitations").insert({
    organization_id: payload.organizationId,
    email: payload.email,
    role: payload.role,
    token,
    invited_by: auth.user.id,
  })

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "ALREADY_INVITED" }
    }

    logger.error("Failed to create organization invitation", error, {
      component: "OrganizationInvitationActions",
      action: "createInvitation",
      organizationId: payload.organizationId,
      email: payload.email,
    })
    return { success: false, error: error.message }
  }

  revalidatePath(`/${payload.locale}/dashboard/settings`)
  return { success: true, token }
}

export async function cancelOrganizationInvitation(input: unknown): Promise<InvitationActionResult> {
  const validation = CancelInvitationSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Invalid invitation id" }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  const { invitationId, locale } = validation.data
  const { data: invitation, error: invitationError } = await supabase
    .from("organization_invitations")
    .select("organization_id")
    .eq("id", invitationId)
    .single()

  if (invitationError || !invitation) {
    return { success: false, error: "Invitation not found" }
  }

  try {
    await assertPermission(supabase, user.id, invitation.organization_id, "canInviteMembers")
  } catch (error) {
    logger.warn("Unauthorized invitation cancellation attempt", {
      component: "OrganizationInvitationActions",
      action: "cancelInvitation",
      invitationId,
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: "Unauthorized" }
  }

  const { error } = await supabase.from("organization_invitations").delete().eq("id", invitationId)
  if (error) {
    logger.error("Failed to cancel organization invitation", error, {
      component: "OrganizationInvitationActions",
      action: "cancelInvitation",
      invitationId,
    })
    return { success: false, error: error.message }
  }

  revalidatePath(`/${locale}/dashboard/settings`)
  return { success: true }
}
