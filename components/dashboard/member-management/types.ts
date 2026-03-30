import type { OrganizationRole } from "@/lib/rbac"

export interface Member {
  id: string
  user_id: string
  organization_id: string
  role: OrganizationRole
  invited_at: string
  user_email: string
}

export type InvitationRole = Exclude<OrganizationRole, "owner">

export interface Invitation {
  id: string
  email: string
  role: InvitationRole
  invited_at: string
  expires_at: string
}
