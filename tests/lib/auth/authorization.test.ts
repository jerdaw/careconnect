import { describe, it, expect, vi, beforeEach } from "vitest"
import { assertServiceOwnership, assertOrganizationMembership, getEffectivePermissions } from "@/lib/auth/authorization"
import { AuthorizationError, NotFoundError } from "@/lib/api-utils"

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

describe("Authorization Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
  })
})
