import { SupabaseClient } from "@supabase/supabase-js"
import { AuthorizationError, NotFoundError } from "@/lib/api-utils"
import { OrganizationRole, RolePermissions, hasPermission } from "@/lib/rbac"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { CircuitOpenError } from "@/lib/resilience/circuit-breaker"
import { logger } from "@/lib/logger"

type RiskLevel = "high" | "medium" | "low"

/**
 * Asserts that a user has permission to modify a service based on organization membership.
 * Throws AuthorizationError if access is denied.
 */
export async function assertServiceOwnership(
  supabase: SupabaseClient,
  userId: string,
  serviceId: string,
  allowedRoles: string[] = ["owner", "admin", "editor"],
  riskLevel: RiskLevel = "high"
) {
  try {
    return await withCircuitBreaker(async () => {
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
    })
  } catch (error) {
    if (error instanceof CircuitOpenError && riskLevel === "low") {
      logger.warn("Authorization bypassed: Circuit breaker open", {
        userId,
        serviceId,
        riskLevel,
        component: "authorization",
      })
      return true // Allow fail-open for low risk
    }
    // Re-throw AuthorizationError or CircuitOpenError
    throw error
  }
}

/**
 * Asserts that a user is a member of an organization with specific roles.
 */
export async function assertOrganizationMembership(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  allowedRoles: string[] = ["owner", "admin", "editor", "viewer"],
  riskLevel: RiskLevel = "medium"
) {
  try {
    return await withCircuitBreaker(async () => {
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
    })
  } catch (error) {
    if (error instanceof CircuitOpenError && riskLevel === "low") {
      logger.warn("Authorization bypassed: Circuit breaker open", {
        userId,
        orgId,
        riskLevel,
        component: "authorization",
      })
      return true
    }
    throw error
  }
}

/**
 * Asserts that a user has the 'admin' role in their metadata.
 * Uses the provided supabase client (ssr).
 */
export async function assertAdminRole(supabase: SupabaseClient, _userId: string, riskLevel: RiskLevel = "high") {
  try {
    return await withCircuitBreaker(async () => {
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
    })
  } catch (error) {
    if (error instanceof CircuitOpenError && riskLevel === "low") {
      logger.warn("Authorization bypassed: Circuit breaker open", {
        userId: _userId,
        riskLevel,
        component: "authorization",
        action: "assertAdminRole",
      })
      return true
    }
    throw error
  }
}

/**
 * Returns the effective permissions for a user within an organization.
 */
export async function getEffectivePermissions(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  riskLevel: RiskLevel = "low"
) {
  try {
    return await withCircuitBreaker(async () => {
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
    })
  } catch (error) {
    if (error instanceof CircuitOpenError && riskLevel === "low") {
      logger.warn("Authorization bypassed (returning restricted perms): Circuit breaker open", {
        userId,
        orgId,
        riskLevel,
        component: "authorization",
      })
      return {
        canEdit: false,
        canDelete: false,
        canViewPrivate: false,
        role: null,
      }
    }
    throw error
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
  permission: keyof RolePermissions,
  riskLevel: RiskLevel = "high"
): Promise<OrganizationRole> {
  try {
    return await withCircuitBreaker(async () => {
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
    })
  } catch (error) {
    if (error instanceof CircuitOpenError && riskLevel === "low") {
      logger.warn("Authorization bypassed: Circuit breaker open", {
        userId,
        orgId,
        permission,
        riskLevel,
        component: "authorization",
      })
      // Return a safe default role for low-risk if bypassed (viewer)
      return "viewer" as OrganizationRole
    }
    throw error
  }
}

/**
 * Gets the user's role within an organization.
 * Returns null if user is not a member.
 */
export async function getUserOrganizationRole(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  riskLevel: RiskLevel = "low"
): Promise<OrganizationRole | null> {
  try {
    return await withCircuitBreaker(async () => {
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
    })
  } catch (error) {
    if (error instanceof CircuitOpenError && riskLevel === "low") {
      logger.warn("Authorization bypassed (returning null role): Circuit breaker open", {
        userId,
        orgId,
        riskLevel,
        component: "authorization",
      })
      return null
    }
    throw error
  }
}

/**
 * Checks if a user is a platform admin via the app_admins table.
 * Returns true if user exists in app_admins, false otherwise.
 */
export async function isUserAdmin(
  supabase: SupabaseClient,
  userId: string,
  riskLevel: RiskLevel = "high"
): Promise<boolean> {
  try {
    return await withCircuitBreaker(async () => {
      const { data, error } = await supabase.from("app_admins").select("user_id").eq("user_id", userId).single()

      if (error || !data) {
        return false
      }

      return true
    })
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      logger.warn("Admin check bypassed: Circuit breaker open", {
        userId,
        riskLevel,
        component: "authorization",
        action: "isUserAdmin",
        // Fail closed for high risk, fail open for low risk
        result: riskLevel === "low",
      })
      return riskLevel === "low"
    }
    // On any other error, fail closed (deny admin access)
    logger.error("Admin check failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      component: "authorization",
    })
    return false
  }
}
