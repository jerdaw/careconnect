import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useMemberManagement } from "@/components/dashboard/member-management/useMemberManagement"

const {
  mockToast,
  mockToastApi,
  mockTranslate,
  mockGetOrganizationMembersWithEmails,
  mockChangeMemberRole,
  mockRemoveMember,
  mockTransferOwnership,
  mockListOrganizationInvitations,
  mockCreateOrganizationInvitation,
  mockCancelOrganizationInvitation,
} = vi.hoisted(() => ({
  mockToast: vi.fn(),
  mockToastApi: { toast: vi.fn() },
  mockTranslate: vi.fn((key: string) => key),
  mockGetOrganizationMembersWithEmails: vi.fn(),
  mockChangeMemberRole: vi.fn(),
  mockRemoveMember: vi.fn(),
  mockTransferOwnership: vi.fn(),
  mockListOrganizationInvitations: vi.fn(),
  mockCreateOrganizationInvitation: vi.fn(),
  mockCancelOrganizationInvitation: vi.fn(),
}))

mockToastApi.toast = mockToast

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => mockTranslate,
}))

vi.mock("@/components/layout/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "owner@example.com",
    },
  }),
}))

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => mockToastApi,
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock("@/lib/actions/members", () => ({
  getOrganizationMembersWithEmails: mockGetOrganizationMembersWithEmails,
  changeMemberRole: mockChangeMemberRole,
  removeMember: mockRemoveMember,
  transferOwnership: mockTransferOwnership,
}))

vi.mock("@/lib/actions/organization-invitations", () => ({
  listOrganizationInvitations: mockListOrganizationInvitations,
  createOrganizationInvitation: mockCreateOrganizationInvitation,
  cancelOrganizationInvitation: mockCancelOrganizationInvitation,
}))

describe("useMemberManagement", () => {
  const initialMembers = [
    {
      id: "member-1",
      user_id: "user-1",
      organization_id: "org-1",
      role: "owner" as const,
      invited_at: "2026-03-01T00:00:00.000Z",
      user_email: "owner@example.com",
    },
  ]

  const initialInvitations = [
    {
      id: "invite-1",
      email: "pending@example.com",
      role: "viewer" as const,
      invited_at: "2026-03-02T00:00:00.000Z",
      expires_at: "2026-04-02T00:00:00.000Z",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetOrganizationMembersWithEmails.mockResolvedValue(initialMembers)
    mockListOrganizationInvitations.mockResolvedValue(initialInvitations)
    mockCreateOrganizationInvitation.mockResolvedValue({ success: true, token: "token-123" })
    mockCancelOrganizationInvitation.mockResolvedValue({ success: true })
    mockChangeMemberRole.mockResolvedValue({ success: true })
    mockRemoveMember.mockResolvedValue({ success: true })
    mockTransferOwnership.mockResolvedValue({ success: true })
  })

  it("loads members and invitations on mount", async () => {
    const { result } = renderHook(() => useMemberManagement("org-1"))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.members).toEqual(initialMembers)
    expect(result.current.invitations).toEqual(initialInvitations)
  })

  it("creates an invitation and refreshes pending invitations", async () => {
    const refreshedInvitations = [
      ...initialInvitations,
      {
        id: "invite-2",
        email: "new@example.com",
        role: "editor" as const,
        invited_at: "2026-03-03T00:00:00.000Z",
        expires_at: "2026-04-03T00:00:00.000Z",
      },
    ]

    mockListOrganizationInvitations
      .mockResolvedValueOnce(initialInvitations)
      .mockResolvedValueOnce(refreshedInvitations)

    const { result } = renderHook(() => useMemberManagement("org-1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.inviteDialog.onEmailChange("new@example.com")
      result.current.inviteDialog.onRoleChange("editor")
    })

    await result.current.inviteDialog.onInvite()

    expect(mockCreateOrganizationInvitation).toHaveBeenCalledWith({
      organizationId: "org-1",
      locale: "en",
      email: "new@example.com",
      role: "editor",
    })
    expect(mockListOrganizationInvitations).toHaveBeenCalledTimes(2)
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "toast.successTitle",
      })
    )
  })

  it("cancels an invitation and refreshes the invitation list", async () => {
    mockListOrganizationInvitations.mockResolvedValueOnce(initialInvitations).mockResolvedValueOnce([])

    const { result } = renderHook(() => useMemberManagement("org-1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.onCancelInvitation("invite-1")

    expect(mockCancelOrganizationInvitation).toHaveBeenCalledWith({
      invitationId: "invite-1",
      locale: "en",
    })
    expect(mockListOrganizationInvitations).toHaveBeenCalledTimes(2)
  })

  it("changes a member role and refreshes the members list", async () => {
    const updatedMembers = [
      {
        ...initialMembers[0],
        role: "admin" as const,
      },
    ]

    mockGetOrganizationMembersWithEmails.mockResolvedValueOnce(initialMembers).mockResolvedValueOnce(updatedMembers)

    const { result } = renderHook(() => useMemberManagement("org-1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.onUpdateRole("member-1", "admin")

    expect(mockChangeMemberRole).toHaveBeenCalledWith("member-1", "admin", "en")
    expect(mockGetOrganizationMembersWithEmails).toHaveBeenCalledTimes(2)
  })
})
