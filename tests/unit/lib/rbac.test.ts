import { describe, it, expect } from "vitest"
import {
  getRolePermissions,
  hasPermission,
  meetsRoleRequirement,
  canModifyRole,
  canRemoveMember,
  getAssignableRoles,
  getRoleLabelKey,
  getRoleDescriptionKey,
  isValidRole,
} from "@/lib/rbac"

describe("getRolePermissions", () => {
  it("returns correct permissions for owner", () => {
    const perms = getRolePermissions("owner")

    // Owner should have all permissions
    expect(perms.canTransferOwnership).toBe(true)
    expect(perms.canDeleteOrganization).toBe(true)
    expect(perms.canEditAllServices).toBe(true)
    expect(perms.canChangeRoles).toBe(true)
    expect(perms.canRemoveMembers).toBe(true)
    expect(perms.canInviteMembers).toBe(true)
    expect(perms.canCreateServices).toBe(true)
    expect(perms.canDeleteServices).toBe(true)
    expect(perms.canPublishServices).toBe(true)
  })

  it("returns correct permissions for admin", () => {
    const perms = getRolePermissions("admin")

    // Admin has most permissions except ownership-specific ones
    expect(perms.canTransferOwnership).toBe(false)
    expect(perms.canDeleteOrganization).toBe(false)
    expect(perms.canEditAllServices).toBe(true)
    expect(perms.canChangeRoles).toBe(true)
    expect(perms.canRemoveMembers).toBe(true)
    expect(perms.canInviteMembers).toBe(true)
    expect(perms.canPublishServices).toBe(true)
  })

  it("returns correct permissions for editor", () => {
    const perms = getRolePermissions("editor")

    // Editor can create and edit own services
    expect(perms.canCreateServices).toBe(true)
    expect(perms.canEditOwnServices).toBe(true)
    expect(perms.canEditAllServices).toBe(false)
    expect(perms.canDeleteServices).toBe(false) // Editor cannot delete services
    expect(perms.canPublishServices).toBe(false)
    expect(perms.canChangeRoles).toBe(false)
    expect(perms.canRemoveMembers).toBe(false)
    expect(perms.canInviteMembers).toBe(false)
  })

  it("returns correct permissions for viewer", () => {
    const perms = getRolePermissions("viewer")

    // Viewer has read-only access
    expect(perms.canViewServices).toBe(true)
    expect(perms.canViewMembers).toBe(true)
    expect(perms.canViewAnalytics).toBe(true)
    expect(perms.canViewFeedback).toBe(true)
    expect(perms.canCreateServices).toBe(false)
    expect(perms.canEditOwnServices).toBe(false)
    expect(perms.canDeleteServices).toBe(false)
    expect(perms.canChangeRoles).toBe(false)
    expect(perms.canRemoveMembers).toBe(false)
    expect(perms.canRespondToFeedback).toBe(false)
  })
})

describe("hasPermission", () => {
  it("correctly checks permissions for each role", () => {
    expect(hasPermission("owner", "canTransferOwnership")).toBe(true)
    expect(hasPermission("admin", "canTransferOwnership")).toBe(false)
    expect(hasPermission("editor", "canEditOwnServices")).toBe(true)
    expect(hasPermission("editor", "canEditAllServices")).toBe(false)
    expect(hasPermission("viewer", "canViewServices")).toBe(true)
    expect(hasPermission("viewer", "canCreateServices")).toBe(false)
  })
})

describe("meetsRoleRequirement", () => {
  it("returns true when user role meets or exceeds required role", () => {
    expect(meetsRoleRequirement("owner", "owner")).toBe(true)
    expect(meetsRoleRequirement("owner", "admin")).toBe(true)
    expect(meetsRoleRequirement("owner", "editor")).toBe(true)
    expect(meetsRoleRequirement("owner", "viewer")).toBe(true)

    expect(meetsRoleRequirement("admin", "owner")).toBe(false)
    expect(meetsRoleRequirement("admin", "admin")).toBe(true)
    expect(meetsRoleRequirement("admin", "editor")).toBe(true)
    expect(meetsRoleRequirement("admin", "viewer")).toBe(true)

    expect(meetsRoleRequirement("editor", "admin")).toBe(false)
    expect(meetsRoleRequirement("editor", "editor")).toBe(true)
    expect(meetsRoleRequirement("editor", "viewer")).toBe(true)

    expect(meetsRoleRequirement("viewer", "editor")).toBe(false)
    expect(meetsRoleRequirement("viewer", "viewer")).toBe(true)
  })
})

describe("canModifyRole", () => {
  it("owner can modify any role except owner (unless self)", () => {
    expect(canModifyRole("owner", "admin", false)).toBe(true)
    expect(canModifyRole("owner", "editor", false)).toBe(true)
    expect(canModifyRole("owner", "viewer", false)).toBe(true)
    expect(canModifyRole("owner", "owner", false)).toBe(false) // Cannot modify another owner
    expect(canModifyRole("owner", "owner", true)).toBe(false) // Cannot modify self
  })

  it("admin can modify editor and viewer roles only", () => {
    expect(canModifyRole("admin", "owner", false)).toBe(false)
    expect(canModifyRole("admin", "admin", false)).toBe(false)
    expect(canModifyRole("admin", "editor", false)).toBe(true)
    expect(canModifyRole("admin", "viewer", false)).toBe(true)
    expect(canModifyRole("admin", "admin", true)).toBe(false) // Cannot modify self
  })

  it("editor and viewer cannot modify any roles", () => {
    expect(canModifyRole("editor", "viewer", false)).toBe(false)
    expect(canModifyRole("viewer", "viewer", false)).toBe(false)
  })
})

describe("canRemoveMember", () => {
  it("owner can remove admin, editor, and viewer (not other owners)", () => {
    expect(canRemoveMember("owner", "owner", false)).toBe(false) // Cannot remove another owner
    expect(canRemoveMember("owner", "admin", false)).toBe(true)
    expect(canRemoveMember("owner", "editor", false)).toBe(true)
    expect(canRemoveMember("owner", "viewer", false)).toBe(true)
  })

  it("admin can remove editor and viewer only", () => {
    expect(canRemoveMember("admin", "owner", false)).toBe(false)
    expect(canRemoveMember("admin", "admin", false)).toBe(false)
    expect(canRemoveMember("admin", "editor", false)).toBe(true)
    expect(canRemoveMember("admin", "viewer", false)).toBe(true)
  })

  it("nobody can remove themselves", () => {
    // Self-removal is not allowed - users need a separate "leave organization" feature
    expect(canRemoveMember("owner", "owner", true)).toBe(false)
    expect(canRemoveMember("admin", "admin", true)).toBe(false)
    expect(canRemoveMember("editor", "editor", true)).toBe(false)
    expect(canRemoveMember("viewer", "viewer", true)).toBe(false)
  })

  it("editor and viewer cannot remove others", () => {
    expect(canRemoveMember("editor", "viewer", false)).toBe(false)
    expect(canRemoveMember("viewer", "viewer", false)).toBe(false)
  })
})

describe("getAssignableRoles", () => {
  it("owner can assign admin, editor, and viewer", () => {
    const roles = getAssignableRoles("owner")
    expect(roles).toContain("admin")
    expect(roles).toContain("editor")
    expect(roles).toContain("viewer")
    expect(roles).not.toContain("owner") // Owner cannot be assigned, must be transferred
    expect(roles.length).toBe(3)
  })

  it("admin can assign editor and viewer", () => {
    const roles = getAssignableRoles("admin")
    expect(roles).toContain("editor")
    expect(roles).toContain("viewer")
    expect(roles).not.toContain("owner")
    expect(roles).not.toContain("admin")
    expect(roles.length).toBe(2)
  })

  it("editor and viewer cannot assign roles", () => {
    expect(getAssignableRoles("editor")).toEqual([])
    expect(getAssignableRoles("viewer")).toEqual([])
  })
})

describe("role i18n key helpers", () => {
  it("returns stable label keys", () => {
    expect(getRoleLabelKey("owner")).toBe("roles.owner.label")
    expect(getRoleLabelKey("admin")).toBe("roles.admin.label")
    expect(getRoleLabelKey("editor")).toBe("roles.editor.label")
    expect(getRoleLabelKey("viewer")).toBe("roles.viewer.label")
  })

  it("returns stable description keys", () => {
    expect(getRoleDescriptionKey("owner")).toBe("roles.owner.description")
    expect(getRoleDescriptionKey("admin")).toBe("roles.admin.description")
    expect(getRoleDescriptionKey("editor")).toBe("roles.editor.description")
    expect(getRoleDescriptionKey("viewer")).toBe("roles.viewer.description")
  })
})

describe("isValidRole", () => {
  it("returns true for valid roles", () => {
    expect(isValidRole("owner")).toBe(true)
    expect(isValidRole("admin")).toBe(true)
    expect(isValidRole("editor")).toBe(true)
    expect(isValidRole("viewer")).toBe(true)
  })

  it("returns false for invalid roles", () => {
    expect(isValidRole("superadmin")).toBe(false)
    expect(isValidRole("guest")).toBe(false)
    expect(isValidRole("")).toBe(false)
    expect(isValidRole("OWNER")).toBe(false) // Case-sensitive
  })
})
