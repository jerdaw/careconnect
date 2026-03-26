"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { OrganizationRole, canModifyRole, canRemoveMember } from "@/lib/rbac"
import { ChangeMemberRoleSchema, RemoveMemberSchema, TransferOwnershipSchema } from "@/lib/schemas/member"
import { logger } from "@/lib/logger"

interface OrganizationMember {
  id: string
  user_id: string
  organization_id: string
  role: OrganizationRole
}

/**
 * Get user's organization membership
 */
export async function getUserOrganizationMembership(userId: string): Promise<OrganizationMember | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("organization_members").select("*").eq("user_id", userId).single()

  if (error || !data) return null

  return data as unknown as OrganizationMember
}

/**
 * Get all members of an organization with their email addresses
 * Uses profiles table or auth metadata to fetch emails
 */
export async function getOrganizationMembersWithEmails(
  orgId: string
): Promise<Array<OrganizationMember & { user_email: string; invited_at: string }>> {
  const supabase = await createClient()

  // Get members with user metadata
  const { data: members, error } = await supabase
    .from("organization_members")
    .select(
      `
      *,
      profiles:user_id (
        email
      )
    `
    )
    .eq("organization_id", orgId)
    .order("role", { ascending: true })

  if (error || !members) {
    logger.error("Failed to fetch organization members", error, {
      component: "MemberActions",
      action: "getMembers",
      orgId,
    })
    return []
  }

  // If profiles table doesn't exist or doesn't have emails, try auth.users
  // This requires service role key, so it will fail in client-side contexts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join response typing
  const enrichedMembers = members.map((member: any) => ({
    id: member.id,
    user_id: member.user_id,
    organization_id: member.organization_id,
    role: member.role as OrganizationRole,
    invited_at: member.invited_at,
    user_email: member.profiles?.email || "N/A",
  }))

  return enrichedMembers
}

/**
 * Change a member's role
 * Enforces RBAC rules for who can change whose role
 */
export async function changeMemberRole(
  memberId: string,
  newRole: string,
  locale: string
): Promise<{ success: boolean; error?: string }> {
  // Validate input with Zod
  const validation = ChangeMemberRoleSchema.safeParse({ memberId, newRole, locale })
  if (!validation.success) {
    logger.warn("Change member role validation failed", {
      component: "MemberActions",
      action: "changeRole",
      errors: validation.error.flatten(),
    })
    return { success: false, error: validation.error.errors[0]?.message || "Invalid input" }
  }

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  // Get current user's membership
  const userMembership = await getUserOrganizationMembership(user.id)
  if (!userMembership) {
    return { success: false, error: "You are not a member of an organization" }
  }

  // Get target member info
  const { data: targetMember, error: targetError } = await supabase
    .from("organization_members")
    .select("*")
    .eq("id", memberId)
    .single()

  if (targetError || !targetMember) {
    logger.error("Target member not found", targetError, {
      component: "MemberActions",
      action: "changeRole",
      memberId,
      userId: user.id,
    })
    return { success: false, error: "Member not found" }
  }

  const target = targetMember as unknown as OrganizationMember

  // Verify same organization
  if (target.organization_id !== userMembership.organization_id) {
    logger.warn("Attempted cross-org role change", {
      component: "MemberActions",
      action: "changeRole",
      userId: user.id,
      targetOrg: target.organization_id,
      userOrg: userMembership.organization_id,
    })
    return { success: false, error: "Cannot modify members from other organizations" }
  }

  // Check if user can modify this role
  const isSelf = target.user_id === user.id
  if (!canModifyRole(userMembership.role, target.role, isSelf)) {
    logger.warn("Insufficient permissions to change role", {
      component: "MemberActions",
      action: "changeRole",
      userId: user.id,
      userRole: userMembership.role,
      targetRole: target.role,
      isSelf,
    })
    return { success: false, error: "Insufficient permissions to change this role" }
  }

  // Update the role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase type inference limitation
  const { error: updateError } = await (supabase.from("organization_members") as any)
    .update({ role: newRole })
    .eq("id", memberId)

  if (updateError) {
    logger.error("Role update failed", updateError, {
      component: "MemberActions",
      action: "changeRole",
      memberId,
      newRole,
      userId: user.id,
    })
    return { success: false, error: updateError.message }
  }

  logger.info("Member role changed successfully", {
    component: "MemberActions",
    action: "changeRole",
    memberId,
    newRole,
    previousRole: target.role,
    userId: user.id,
    orgId: userMembership.organization_id,
  })

  // Revalidate paths
  revalidatePath(`/${locale}/dashboard/settings`)

  return { success: true }
}

/**
 * Remove a member from organization
 * Enforces RBAC rules for who can remove whom
 */
export async function removeMember(memberId: string, locale: string): Promise<{ success: boolean; error?: string }> {
  // Validate input with Zod
  const validation = RemoveMemberSchema.safeParse({ memberId, locale })
  if (!validation.success) {
    logger.warn("Remove member validation failed", {
      component: "MemberActions",
      action: "remove",
      errors: validation.error.flatten(),
    })
    return { success: false, error: validation.error.errors[0]?.message || "Invalid input" }
  }

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  // Get current user's membership
  const userMembership = await getUserOrganizationMembership(user.id)
  if (!userMembership) {
    return { success: false, error: "You are not a member of an organization" }
  }

  // Get target member info
  const { data: targetMember, error: targetError } = await supabase
    .from("organization_members")
    .select("*")
    .eq("id", memberId)
    .single()

  if (targetError || !targetMember) {
    logger.error("Target member not found for removal", targetError, {
      component: "MemberActions",
      action: "remove",
      memberId,
      userId: user.id,
    })
    return { success: false, error: "Member not found" }
  }

  const target = targetMember as unknown as OrganizationMember

  // Verify same organization
  if (target.organization_id !== userMembership.organization_id) {
    logger.warn("Attempted cross-org member removal", {
      component: "MemberActions",
      action: "remove",
      userId: user.id,
      targetOrg: target.organization_id,
      userOrg: userMembership.organization_id,
    })
    return { success: false, error: "Cannot remove members from other organizations" }
  }

  // Check if user can remove this member
  const isSelf = target.user_id === user.id
  if (!canRemoveMember(userMembership.role, target.role, isSelf)) {
    logger.warn("Insufficient permissions to remove member", {
      component: "MemberActions",
      action: "remove",
      userId: user.id,
      userRole: userMembership.role,
      targetRole: target.role,
      isSelf,
    })
    return { success: false, error: "Insufficient permissions to remove this member" }
  }

  // Remove the member
  const { error: deleteError } = await supabase.from("organization_members").delete().eq("id", memberId)

  if (deleteError) {
    logger.error("Member removal failed", deleteError, {
      component: "MemberActions",
      action: "remove",
      memberId,
      userId: user.id,
    })
    return { success: false, error: deleteError.message }
  }

  logger.info("Member removed successfully", {
    component: "MemberActions",
    action: "remove",
    memberId,
    removedUserId: target.user_id,
    userId: user.id,
    orgId: userMembership.organization_id,
  })

  // Revalidate paths
  revalidatePath(`/${locale}/dashboard/settings`)

  return { success: true }
}

/**
 * Transfer ownership to another member
 * Uses atomic database function to ensure consistency
 */
export async function transferOwnership(
  newOwnerId: string,
  locale: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  // Validate input with Zod
  const validation = TransferOwnershipSchema.safeParse({ newOwnerId, locale })
  if (!validation.success) {
    logger.warn("Transfer ownership validation failed", {
      component: "MemberActions",
      action: "transferOwnership",
      errors: validation.error.flatten(),
    })
    return { success: false, error: validation.error.errors[0]?.message || "Invalid input" }
  }

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  // Get current user's membership
  const userMembership = await getUserOrganizationMembership(user.id)
  if (!userMembership) {
    return { success: false, error: "You are not a member of an organization" }
  }

  if (userMembership.role !== "owner") {
    logger.warn("Non-owner attempted ownership transfer", {
      component: "MemberActions",
      action: "transferOwnership",
      userId: user.id,
      role: userMembership.role,
    })
    return { success: false, error: "Only the owner can transfer ownership" }
  }

  // Cannot transfer to yourself
  if (newOwnerId === user.id) {
    return { success: false, error: "You are already the owner" }
  }

  // Use atomic database function for transfer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase type inference limitation for RPC
  const { data, error } = await (supabase.rpc as any)("transfer_ownership", {
    p_org_id: userMembership.organization_id,
    p_current_owner_id: user.id,
    p_new_owner_id: newOwnerId,
  })

  if (error) {
    logger.error("Ownership transfer RPC failed", error, {
      component: "MemberActions",
      action: "transferOwnership",
      userId: user.id,
      newOwnerId,
      orgId: userMembership.organization_id,
    })
    return { success: false, error: error.message }
  }

  const result = data as { success: boolean; error?: string; message?: string }

  if (!result.success) {
    logger.warn("Ownership transfer rejected", {
      component: "MemberActions",
      action: "transferOwnership",
      userId: user.id,
      newOwnerId,
      reason: result.error,
    })
    return { success: false, error: result.error || "Failed to transfer ownership" }
  }

  logger.info("Ownership transferred successfully", {
    component: "MemberActions",
    action: "transferOwnership",
    previousOwner: user.id,
    newOwner: newOwnerId,
    orgId: userMembership.organization_id,
  })

  // Revalidate paths
  revalidatePath(`/${locale}/dashboard/settings`)
  revalidatePath(`/${locale}/dashboard`)

  return { success: true, message: result.message }
}
