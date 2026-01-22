import { z } from "zod"

/**
 * Schema for changing a member's role
 */
export const ChangeMemberRoleSchema = z.object({
  memberId: z.string().uuid("Invalid member ID format"),
  newRole: z.enum(["owner", "admin", "editor", "viewer"], {
    errorMap: () => ({ message: "Role must be owner, admin, editor, or viewer" }),
  }),
  locale: z.string().min(2).max(5),
})

export type ChangeMemberRoleInput = z.infer<typeof ChangeMemberRoleSchema>

/**
 * Schema for removing a member
 */
export const RemoveMemberSchema = z.object({
  memberId: z.string().uuid("Invalid member ID format"),
  locale: z.string().min(2).max(5),
})

export type RemoveMemberInput = z.infer<typeof RemoveMemberSchema>

/**
 * Schema for transferring ownership
 */
export const TransferOwnershipSchema = z.object({
  newOwnerId: z.string().uuid("Invalid user ID format"),
  locale: z.string().min(2).max(5),
})

export type TransferOwnershipInput = z.infer<typeof TransferOwnershipSchema>

/**
 * Schema for inviting a member
 */
export const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "editor", "viewer"], {
    errorMap: () => ({ message: "Can only invite as admin, editor, or viewer" }),
  }),
  locale: z.string().min(2).max(5),
})

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>
