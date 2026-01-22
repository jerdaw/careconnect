/**
 * Role-Based Access Control (RBAC) Utilities
 * Phase 4: v17.4 Dashboard Partner Portal
 *
 * Defines role hierarchy, permissions, and access control functions
 */

export type OrganizationRole = "owner" | "admin" | "editor" | "viewer"

/**
 * i18n keys for role labels and descriptions.
 *
 * UI should translate these via next-intl, e.g.:
 * - useTranslations("Dashboard.settings.members") and t(getRoleLabelKey(role))
 */
export function getRoleLabelKey(role: OrganizationRole): string {
  return `roles.${role}.label`
}

export function getRoleDescriptionKey(role: OrganizationRole): string {
  return `roles.${role}.description`
}

/**
 * Role hierarchy with numeric levels
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
}

/**
 * Permission definitions for each role
 */
export interface RolePermissions {
  // Service permissions
  canViewServices: boolean
  canCreateServices: boolean
  canEditOwnServices: boolean
  canEditAllServices: boolean
  canDeleteServices: boolean
  canPublishServices: boolean

  // Member permissions
  canViewMembers: boolean
  canInviteMembers: boolean
  canRemoveMembers: boolean
  canChangeRoles: boolean
  canTransferOwnership: boolean

  // Organization permissions
  canEditOrganization: boolean
  canDeleteOrganization: boolean
  canManageSettings: boolean

  // Analytics & Feedback
  canViewAnalytics: boolean
  canViewFeedback: boolean
  canRespondToFeedback: boolean

  // Notifications
  canViewNotifications: boolean
  canManageNotifications: boolean
}

/**
 * Get permissions for a given role
 */
export function getRolePermissions(role: OrganizationRole): RolePermissions {
  switch (role) {
    case "owner":
      return {
        canViewServices: true,
        canCreateServices: true,
        canEditOwnServices: true,
        canEditAllServices: true,
        canDeleteServices: true,
        canPublishServices: true,
        canViewMembers: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangeRoles: true,
        canTransferOwnership: true,
        canEditOrganization: true,
        canDeleteOrganization: true,
        canManageSettings: true,
        canViewAnalytics: true,
        canViewFeedback: true,
        canRespondToFeedback: true,
        canViewNotifications: true,
        canManageNotifications: true,
      }

    case "admin":
      return {
        canViewServices: true,
        canCreateServices: true,
        canEditOwnServices: true,
        canEditAllServices: true,
        canDeleteServices: true,
        canPublishServices: true,
        canViewMembers: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangeRoles: true,
        canTransferOwnership: false, // Only owner can transfer
        canEditOrganization: true,
        canDeleteOrganization: false, // Only owner can delete
        canManageSettings: true,
        canViewAnalytics: true,
        canViewFeedback: true,
        canRespondToFeedback: true,
        canViewNotifications: true,
        canManageNotifications: true,
      }

    case "editor":
      return {
        canViewServices: true,
        canCreateServices: true,
        canEditOwnServices: true,
        canEditAllServices: false, // Can only edit own
        canDeleteServices: false,
        canPublishServices: false,
        canViewMembers: true,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
        canTransferOwnership: false,
        canEditOrganization: false,
        canDeleteOrganization: false,
        canManageSettings: false,
        canViewAnalytics: true,
        canViewFeedback: true,
        canRespondToFeedback: true,
        canViewNotifications: true,
        canManageNotifications: false,
      }

    case "viewer":
      return {
        canViewServices: true,
        canCreateServices: false,
        canEditOwnServices: false,
        canEditAllServices: false,
        canDeleteServices: false,
        canPublishServices: false,
        canViewMembers: true,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
        canTransferOwnership: false,
        canEditOrganization: false,
        canDeleteOrganization: false,
        canManageSettings: false,
        canViewAnalytics: true,
        canViewFeedback: true,
        canRespondToFeedback: false,
        canViewNotifications: true,
        canManageNotifications: false,
      }
  }
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: OrganizationRole, permission: keyof RolePermissions): boolean {
  const permissions = getRolePermissions(role)
  return permissions[permission]
}

/**
 * Check if userRole meets the minimum required role
 * Returns true if userRole >= requiredRole in hierarchy
 */
export function meetsRoleRequirement(userRole: OrganizationRole, requiredRole: OrganizationRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if userRole can modify targetRole
 * Rules:
 * - Owner can modify any role except themselves
 * - Admin can modify editor and viewer
 * - Editor and viewer cannot modify any roles
 * - Nobody can modify owner
 */
export function canModifyRole(userRole: OrganizationRole, targetRole: OrganizationRole, isSelf: boolean): boolean {
  // Cannot modify yourself
  if (isSelf) return false

  // Cannot modify owner
  if (targetRole === "owner") return false

  // Only owner and admin can modify roles
  if (userRole === "owner") return true
  if (userRole === "admin" && (targetRole === "editor" || targetRole === "viewer")) return true

  return false
}

/**
 * Check if user can remove a member
 * Rules:
 * - Owner can remove anyone except themselves
 * - Admin can remove editors and viewers
 * - Cannot remove owner
 * - Cannot remove yourself
 */
export function canRemoveMember(userRole: OrganizationRole, targetRole: OrganizationRole, isSelf: boolean): boolean {
  // Cannot remove yourself
  if (isSelf) return false

  // Cannot remove owner
  if (targetRole === "owner") return false

  // Owner can remove anyone
  if (userRole === "owner") return true

  // Admin can remove editors and viewers
  if (userRole === "admin" && (targetRole === "editor" || targetRole === "viewer")) return true

  return false
}

/**
 * Validate role value
 */
export function isValidRole(role: string): role is OrganizationRole {
  return ["owner", "admin", "editor", "viewer"].includes(role)
}

/**
 * Get all roles in hierarchy order (highest to lowest)
 */
export function getAllRoles(): OrganizationRole[] {
  return ["owner", "admin", "editor", "viewer"]
}

/**
 * Get roles that a user can assign (based on their role)
 */
export function getAssignableRoles(userRole: OrganizationRole): OrganizationRole[] {
  switch (userRole) {
    case "owner":
      return ["admin", "editor", "viewer"] // Can assign all except owner
    case "admin":
      return ["editor", "viewer"] // Can assign lower roles
    default:
      return [] // Editors and viewers cannot assign roles
  }
}
