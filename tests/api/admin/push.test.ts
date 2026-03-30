import "../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/admin/push/route"
import { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

vi.mock("@/lib/auth/authorization", () => ({
  assertAdminRole: vi.fn().mockResolvedValue(true),
}))

// Mock env
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
    NEXT_PUBLIC_ONESIGNAL_APP_ID: "test-app-id",
    ONESIGNAL_REST_API_KEY: "test-rest-key",
  },
}))

const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: "admin1", app_metadata: { role: "admin" } } },
  error: null,
})
const mockSingle = vi.fn().mockResolvedValue({ data: { id: "audit123" }, error: null })
const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null })

// Standard SSR mocking via next-mocks
vi.mocked(createServerClient).mockReturnValue({
  auth: {
    getUser: mockGetUser,
  },
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: mockSingle,
      })),
      then: (resolve: any) => resolve({ data: null, error: null }),
    })),
  })),
  rpc: mockRpc,
} as any)

// Mock Fetch for OneSignal
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ id: "push123" }),
})
global.fetch = mockFetch

describe("Push API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin1", app_metadata: { role: "admin" } } },
      error: null,
    })
    mockSingle.mockResolvedValue({ data: { id: "audit123" }, error: null })
  })

  it("should send push notification and return success", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test push",
        message: "Body of push",
        type: "service_update",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = (await response.json()) as { data: { success: boolean; notificationId: string } }
    expect(body.data.success).toBe(true)
    expect(body.data.notificationId).toBe("push123")
  })

  it("should return 400 for missing fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test push",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
