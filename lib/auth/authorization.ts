import { SupabaseClient } from "@supabase/supabase-js"
import { AuthorizationError, NotFoundError } from "@/lib/api-utils"
import { OrganizationRole, RolePermissions, hasPermission } from "@/lib/rbac"

/**
 * Asserts that a user has permission to modify a service based on organization membership.
 * Throws AuthorizationError if access is denied.
 */
export async function assertServiceOwnership(
  supabase: SupabaseClient,
  userId: string,
  serviceId: string,
  allowedRoles: string[] = ["owner", "admin", "editor"]
) {
  // 1. Get the service's organization ID
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("org_id")
    .eq("id", serviceId)
    .single()

  if (serviceError || !service) {
    // If we can't find the service, it's a 404
    throw new NotFoundError("Service not found")
  }

  if (!service.org_id) {
    // System-owned or legacy service without org
    throw new AuthorizationError("Service has no organization assigned")
  }

  // 2. Check if user is a member of that organization
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", service.org_id)
    .single()

  if (memberError || !member) {
    // Not a member of the org
    throw new AuthorizationError("You do not have permission to access this service")
  }

  // 3. Check role
  if (!allowedRoles.includes(member.role)) {
    throw new AuthorizationError(`Access denied: Requires ${allowedRoles.join(" or ")} role`)
  }

  return true
}

/**
 * Asserts that a user is a member of an organization with specific roles.
 */
export async function assertOrganizationMembership(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  allowedRoles: string[] = ["owner", "admin", "editor", "viewer"]
) {
  const { data: member, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single()

  if (error || !member) {
    throw new AuthorizationError("You are not a member of this organization")
  }

  if (!allowedRoles.includes(member.role)) {
    throw new AuthorizationError(`Access denied: Requires ${allowedRoles.join(" or ")} role`)
  }

  return true
}

/**
 * Asserts that a user has the 'admin' role in their metadata.
 * Uses the provided supabase client (ssr).
 */
export async function assertAdminRole(supabase: SupabaseClient, _userId: string) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthorizationError("User profile not found")
  }

  // Check custom user_metadata or app_metadata for 'admin' role
  const role = user.user_metadata?.role || user.app_metadata?.role

  if (role !== "admin") {
    throw new AuthorizationError("Access denied: Requires admin role")
  }

  return true
}

/**
 * Returns the effective permissions for a user within an organization.
 */
export async function getEffectivePermissions(supabase: SupabaseClient, userId: string, orgId: string) {
  const { data: member, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single()

  if (error || !member) {
    return {
      canEdit: false,
      canDelete: false,
      canViewPrivate: false,
      role: null,
    }
  }

  return {
    canEdit: ["owner", "admin", "editor"].includes(member.role),
    canDelete: ["owner", "admin"].includes(member.role),
    canViewPrivate: ["owner", "admin", "editor", "viewer"].includes(member.role),
    role: member.role,
  }
}

/**
 * Asserts that a user has a specific permission within an organization.
 * Uses the centralized RBAC permission system.
 * Throws AuthorizationError if access is denied.
 */
export async function assertPermission(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  permission: keyof RolePermissions
): Promise<OrganizationRole> {
  const { data: member, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single()

  if (error || !member) {
    throw new AuthorizationError("You are not a member of this organization")
  }

  const role = member.role as OrganizationRole

  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(`Access denied: Requires ${permission} permission`)
  }

  return role
}

/**
 * Gets the user's role within an organization.
 * Returns null if user is not a member.
 */
export async function getUserOrganizationRole(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<OrganizationRole | null> {
  const { data: member, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single()

  if (error || !member) {
    return null
  }

  return member.role as OrganizationRole
}
