/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockRevalidatePath = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}))

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}))

describe("member actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the current organization membership when present", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "member-1",
        user_id: "user-1",
        organization_id: "org-1",
        role: "admin",
      },
      error: null,
    })
    const eq = vi.fn(() => ({ single }))
    const select = vi.fn(() => ({ eq }))
    mockSupabase.from.mockReturnValue({ select })

    const { getUserOrganizationMembership } = await import("@/lib/actions/members")
    const membership = await getUserOrganizationMembership("user-1")

    expect(membership).toEqual({
      id: "member-1",
      user_id: "user-1",
      organization_id: "org-1",
      role: "admin",
    })
  })

  it("blocks cross-organization role changes", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })

    const membershipSingle = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          id: "member-1",
          user_id: "user-1",
          organization_id: "org-1",
          role: "admin",
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: "member-2",
          user_id: "user-2",
          organization_id: "org-2",
          role: "viewer",
        },
        error: null,
      })

    const membershipEq = vi.fn(() => ({ single: membershipSingle }))
    const membershipSelect = vi.fn(() => ({ eq: membershipEq }))
    mockSupabase.from.mockReturnValue({ select: membershipSelect })

    const { changeMemberRole } = await import("@/lib/actions/members")
    const result = await changeMemberRole("22222222-2222-4222-8222-222222222222", "editor", "en")

    expect(result).toEqual({
      success: false,
      error: "Cannot modify members from other organizations",
    })
    expect(mockLogger.warn).toHaveBeenCalledWith("Attempted cross-org role change", {
      component: "MemberActions",
      action: "changeRole",
      userId: "user-1",
      targetOrg: "org-2",
      userOrg: "org-1",
    })
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
