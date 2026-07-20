import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockAssertPermission, mockCreateClient, mockLogger, mockRevalidatePath } = vi.hoisted(() => ({
  mockAssertPermission: vi.fn(),
  mockCreateClient: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  mockRevalidatePath: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }))
vi.mock("@/lib/auth/authorization", () => ({ assertPermission: mockAssertPermission }))
vi.mock("@/lib/logger", () => ({ logger: mockLogger }))
vi.mock("@/utils/supabase/server", () => ({ createClient: mockCreateClient }))

import { changeMemberRole } from "@/lib/actions/members"
import { createOrganizationInvitation } from "@/lib/actions/organization-invitations"

const USER_ID = "11111111-1111-4111-8111-111111111111"
const MEMBER_ID = "22222222-2222-4222-8222-222222222222"
const TARGET_USER_ID = "33333333-3333-4333-8333-333333333333"
const ORGANIZATION_ID = "44444444-4444-4444-8444-444444444444"

function memberClient() {
  const single = vi
    .fn()
    .mockResolvedValueOnce({
      data: { id: "membership", user_id: USER_ID, organization_id: ORGANIZATION_ID, role: "admin" },
      error: null,
    })
    .mockResolvedValueOnce({
      data: { id: MEMBER_ID, user_id: TARGET_USER_ID, organization_id: ORGANIZATION_ID, role: "editor" },
      error: null,
    })
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    single,
    update: vi.fn(),
    then: (resolve: (value: { error: null }) => unknown) => resolve({ error: null }),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.update.mockReturnValue(query)

  return {
    client: {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } }, error: null })) },
      from: vi.fn(() => query),
    },
    update: query.update,
  }
}

function invitationClient() {
  const insert = vi.fn(async () => ({ error: null }))
  return {
    client: {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } }, error: null })) },
      rpc: vi.fn(async () => ({ data: "invitation-token", error: null })),
      from: vi.fn(() => ({ insert })),
    },
    insert,
  }
}

describe("server-side role assignment policy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("prevents an admin from promoting a member to admin", async () => {
    const { client, update } = memberClient()
    mockCreateClient.mockResolvedValue(client)

    const result = await changeMemberRole(MEMBER_ID, "admin", "en")

    expect(result).toEqual({ success: false, error: "Insufficient permissions to assign this role" })
    expect(update).not.toHaveBeenCalled()
  })

  it("preserves an admin's ability to assign lower roles", async () => {
    const { client, update } = memberClient()
    mockCreateClient.mockResolvedValue(client)

    const result = await changeMemberRole(MEMBER_ID, "viewer", "en")

    expect(result).toEqual({ success: true })
    expect(update).toHaveBeenCalledWith({ role: "viewer" })
  })

  it("prevents an admin from issuing an admin invitation", async () => {
    const { client, insert } = invitationClient()
    mockCreateClient.mockResolvedValue(client)
    mockAssertPermission.mockResolvedValue("admin")

    const result = await createOrganizationInvitation({
      organizationId: ORGANIZATION_ID,
      locale: "en",
      email: "partner@example.org",
      role: "admin",
    })

    expect(result).toEqual({ success: false, error: "Insufficient permissions to assign this role" })
    expect(client.rpc).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
  })

  it("preserves an admin's ability to invite lower roles", async () => {
    const { client, insert } = invitationClient()
    mockCreateClient.mockResolvedValue(client)
    mockAssertPermission.mockResolvedValue("admin")

    const result = await createOrganizationInvitation({
      organizationId: ORGANIZATION_ID,
      locale: "en",
      email: "partner@example.org",
      role: "editor",
    })

    expect(result).toEqual({ success: true, token: "invitation-token" })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ organization_id: ORGANIZATION_ID, role: "editor" }))
  })
})
