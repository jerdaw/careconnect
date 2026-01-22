import { useMemo } from "react"
import {
  OrganizationRole,
  getRolePermissions,
  hasPermission,
  meetsRoleRequirement,
  canModifyRole as canModifyRoleUtil,
  canRemoveMember as canRemoveMemberUtil,
  getRoleLabelKey,
  getRoleDescriptionKey,
  getAssignableRoles,
  RolePermissions,
} from "@/lib/rbac"

/**
 * Hook to access RBAC utilities in React components
 * Provides memoized access to role permissions and checks
 */
export function useRBAC(userRole: OrganizationRole | null | undefined) {
  const permissions = useMemo<RolePermissions | null>(() => {
    if (!userRole) return null
    return getRolePermissions(userRole)
  }, [userRole])

  const checkPermission = useMemo(() => {
    return (permission: keyof RolePermissions): boolean => {
      if (!userRole) return false
      return hasPermission(userRole, permission)
    }
  }, [userRole])

  const meetsRole = useMemo(() => {
    return (requiredRole: OrganizationRole): boolean => {
      if (!userRole) return false
      return meetsRoleRequirement(userRole, requiredRole)
    }
  }, [userRole])

  const canModifyRole = useMemo(() => {
    return (targetRole: OrganizationRole, isSelf: boolean): boolean => {
      if (!userRole) return false
      return canModifyRoleUtil(userRole, targetRole, isSelf)
    }
  }, [userRole])

  const canRemoveMember = useMemo(() => {
    return (targetRole: OrganizationRole, isSelf: boolean): boolean => {
      if (!userRole) return false
      return canRemoveMemberUtil(userRole, targetRole, isSelf)
    }
  }, [userRole])

  const assignableRoles = useMemo(() => {
    if (!userRole) return []
    return getAssignableRoles(userRole)
  }, [userRole])

  const roleLabelKey = useMemo(() => {
    if (!userRole) return ""
    return getRoleLabelKey(userRole)
  }, [userRole])

  const roleDescriptionKey = useMemo(() => {
    if (!userRole) return ""
    return getRoleDescriptionKey(userRole)
  }, [userRole])

  return {
    role: userRole,
    permissions,
    checkPermission,
    meetsRole,
    canModifyRole,
    canRemoveMember,
    assignableRoles,
    roleLabelKey,
    roleDescriptionKey,
    // Convenience flags
    isOwner: userRole === "owner",
    isAdmin: userRole === "admin",
    isEditor: userRole === "editor",
    isViewer: userRole === "viewer",
    isManagerRole: userRole === "owner" || userRole === "admin",
  }
}
