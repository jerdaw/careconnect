import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockAssertPermission, mockCreateClient, mockError, mockRevalidatePath, mockWarn } = vi.hoisted(() => ({
  mockAssertPermission: vi.fn(),
  mockCreateClient: vi.fn(),
  mockError: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockWarn: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }))
vi.mock("@/lib/auth/authorization", () => ({ assertPermission: mockAssertPermission }))
vi.mock("@/lib/logger", () => ({
  logger: {
    error: mockError,
    warn: mockWarn,
  },
}))
vi.mock("@/utils/supabase/server", () => ({ createClient: mockCreateClient }))

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/dashboard-notifications"
import { updateOrganizationAction, upsertOrganizationSettingsAction } from "@/lib/actions/dashboard-settings"

const USER_ID = "11111111-1111-4111-8111-111111111111"
const ORGANIZATION_ID = "22222222-2222-4222-8222-222222222222"
const NOTIFICATION_ID = "33333333-3333-4333-8333-333333333333"

function failingUpdateClient() {
  const failure = new Error("database unavailable")
  const query = {
    update: vi.fn(),
    eq: vi.fn(),
    then: (resolve: (value: { error: Error }) => unknown) => resolve({ error: failure }),
  }
  query.update.mockReturnValue(query)
  query.eq.mockReturnValue(query)

  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } }, error: null })) },
    from: vi.fn(() => query),
  }
}

function authenticatedClient() {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } }, error: null })) },
  }
}

function expectNoPersistentIdentifiers(metadata: Record<string, unknown>) {
  expect(metadata).not.toHaveProperty("notificationId")
  expect(metadata).not.toHaveProperty("userId")
  expect(metadata).not.toHaveProperty("orgId")
  expect(metadata).not.toHaveProperty("organizationId")
}

describe("dashboard action logging privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does not log user or notification identifiers when notification updates fail", async () => {
    mockCreateClient.mockImplementation(async () => failingUpdateClient())

    await markNotificationReadAction({ notificationId: NOTIFICATION_ID, locale: "en" })
    await markAllNotificationsReadAction({ locale: "en" })

    expect(mockError).toHaveBeenCalledTimes(2)
    for (const call of mockError.mock.calls) {
      expectNoPersistentIdentifiers(call[2] as Record<string, unknown>)
    }
  })

  it("does not log user or organization identifiers when settings permission is denied", async () => {
    mockCreateClient.mockImplementation(async () => authenticatedClient())
    mockAssertPermission.mockRejectedValue(new Error("permission denied"))

    await updateOrganizationAction({
      organizationId: ORGANIZATION_ID,
      locale: "en",
      name: "Example organization",
      domain: null,
    })
    await upsertOrganizationSettingsAction({
      organizationId: ORGANIZATION_ID,
      locale: "en",
      website: null,
      phone: null,
      description: null,
      email_on_feedback: false,
      email_on_service_update: false,
      weekly_analytics_report: false,
    })

    expect(mockWarn).toHaveBeenCalledTimes(2)
    for (const call of mockWarn.mock.calls) {
      expectNoPersistentIdentifiers(call[1] as Record<string, unknown>)
    }
  })
})
