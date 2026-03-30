import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  assertServiceOwnership,
  assertOrganizationMembership,
  getEffectivePermissions,
  assertAdminRole,
  getUserOrganizationRole,
} from "@/lib/auth/authorization"
import { AuthorizationError, NotFoundError } from "@/lib/api-utils"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { CircuitOpenError } from "@/lib/resilience/circuit-breaker"

// Mock Supabase Client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

// Mock Circuit Breaker
vi.mock("@/lib/resilience/supabase-breaker", () => ({
  withCircuitBreaker: vi.fn((op) => op()),
}))

describe("Authorization Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset circuit breaker mock to default behavior
    vi.mocked(withCircuitBreaker).mockImplementation((op) => op())
  })

  describe("assertServiceOwnership", () => {
    it("passes for service owner/admin/editor", async () => {
      // Service belongs to org-A
      mockSupabase.single.mockResolvedValueOnce({ data: { org_id: "org-A" }, error: null })

      // User is admin of org-A
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin" }, error: null })

      await expect(assertServiceOwnership(mockSupabase as any, "user-1", "service-1")).resolves.toBe(true)
    })

    it("throws NotFoundError if service missing", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } })

      await expect(assertServiceOwnership(mockSupabase as any, "user-1", "service-1")).rejects.toThrow(NotFoundError)
    })

    it("throws AuthorizationError for non-member", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { org_id: "org-A" }, error: null })
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })

      await expect(assertServiceOwnership(mockSupabase as any, "user-1", "service-1")).rejects.toThrow(
        AuthorizationError
      )
    })

    it("fails closed on circuit open (high risk default)", async () => {
      vi.mocked(withCircuitBreaker).mockRejectedValueOnce(new CircuitOpenError("supabase"))

      await expect(assertServiceOwnership(mockSupabase as any, "user-1", "service-1")).rejects.toThrow(CircuitOpenError)
    })

    it("fails open on circuit open if riskLevel is low", async () => {
      vi.mocked(withCircuitBreaker).mockRejectedValueOnce(new CircuitOpenError("supabase"))

      const result = await assertServiceOwnership(mockSupabase as any, "user-1", "service-1", ["admin"], "low")
      expect(result).toBe(true)
    })
  })

  describe("assertOrganizationMembership", () => {
    it("passes for required role", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "editor" }, error: null })

      await expect(assertOrganizationMembership(mockSupabase as any, "user-1", "org-1", ["editor"])).resolves.toBe(true)
    })

    it("throws for insufficient role", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "viewer" }, error: null })

      await expect(assertOrganizationMembership(mockSupabase as any, "user-1", "org-1", ["editor"])).rejects.toThrow(
        AuthorizationError
      )
    })

    it("fails closed on circuit open (medium risk default)", async () => {
      vi.mocked(withCircuitBreaker).mockRejectedValueOnce(new CircuitOpenError("supabase"))

      await expect(assertOrganizationMembership(mockSupabase as any, "user-1", "org-1")).rejects.toThrow(
        CircuitOpenError
      )
    })
  })

  describe("getEffectivePermissions", () => {
    it("returns correct permissions for owner", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "owner" }, error: null })

      const perms = await getEffectivePermissions(mockSupabase as any, "user-1", "org-1")
      expect(perms.canEdit).toBe(true)
      expect(perms.canDelete).toBe(true)
      expect(perms.canViewPrivate).toBe(true)
      expect(perms.role).toBe("owner")
    })

    it("returns correct permissions for viewer", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "viewer" }, error: null })

      const perms = await getEffectivePermissions(mockSupabase as any, "user-1", "org-1")
      expect(perms.canEdit).toBe(false)
      expect(perms.canDelete).toBe(false)
      expect(perms.canViewPrivate).toBe(true)
      expect(perms.role).toBe("viewer")
    })

    it("returns false for non-members", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })

      const perms = await getEffectivePermissions(mockSupabase as any, "user-1", "org-1")
      expect(perms.canEdit).toBe(false)
      expect(perms.role).toBeNull()
    })

    it("fails open with safe defaults on circuit open (low risk default)", async () => {
      vi.mocked(withCircuitBreaker).mockRejectedValueOnce(new CircuitOpenError("supabase"))

      const perms = await getEffectivePermissions(mockSupabase as any, "user-1", "org-1")
      expect(perms.canEdit).toBe(false)
      expect(perms.role).toBeNull()
    })
  })

  describe("getUserOrganizationRole", () => {
    it("returns role for member", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin" }, error: null })

      const role = await getUserOrganizationRole(mockSupabase as any, "user-1", "org-1")
      expect(role).toBe("admin")
    })

    it("returns null for non-member", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })

      const role = await getUserOrganizationRole(mockSupabase as any, "user-1", "org-1")
      expect(role).toBeNull()
    })

    it("fails open on circuit open", async () => {
      vi.mocked(withCircuitBreaker).mockRejectedValueOnce(new CircuitOpenError("supabase"))

      const role = await getUserOrganizationRole(mockSupabase as any, "user-1", "org-1")
      expect(role).toBeNull()
    })
  })

  describe("assertAdminRole", () => {
    it("passes for admin user", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-1" } },
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: { user_id: "user-1" },
        error: null,
      })

      await expect(assertAdminRole(mockSupabase as any, "user-1")).resolves.toBe(true)
    })

    it("throws for non-admin user", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-1" } },
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      })

      await expect(assertAdminRole(mockSupabase as any, "user-1")).rejects.toThrow(AuthorizationError)
    })

    it("fails closed on circuit open", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-1" } },
        error: null,
      })
      vi.mocked(withCircuitBreaker).mockRejectedValueOnce(new CircuitOpenError("supabase"))

      await expect(assertAdminRole(mockSupabase as any, "user-1")).rejects.toThrow(AuthorizationError)
    })
  })
})
