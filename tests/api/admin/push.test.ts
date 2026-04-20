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
const mockFrom = vi.fn()
const mockNotificationAuditInsert = vi.fn().mockResolvedValue({ data: null, error: null })
const mockAuditLogsInsert = vi.fn().mockResolvedValue({ data: null, error: null })
const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null })

// Standard SSR mocking via next-mocks
vi.mocked(createServerClient).mockReturnValue({
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
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
    mockNotificationAuditInsert.mockResolvedValue({ data: null, error: null })
    mockAuditLogsInsert.mockResolvedValue({ data: null, error: null })
    mockRpc.mockResolvedValue({ data: null, error: null })
    mockFrom.mockImplementation((table: string) => {
      if (table === "notification_audit") {
        return { insert: mockNotificationAuditInsert }
      }

      if (table === "audit_logs") {
        return { insert: mockAuditLogsInsert }
      }

      return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) }
    })
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
    const body = (await response.json()) as {
      data: { success: boolean; notificationId: string; auditStatus: string; warnings: string[] }
    }
    expect(body.data.success).toBe(true)
    expect(body.data.notificationId).toBe("push123")
    expect(body.data.auditStatus).toBe("ok")
    expect(body.data.warnings).toEqual([])
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

  it("returns degraded audit status when audit writes fail after send", async () => {
    mockNotificationAuditInsert.mockResolvedValue({ data: null, error: { message: "audit insert failed" } })
    mockAuditLogsInsert.mockResolvedValue({ data: null, error: { message: "log insert failed" } })
    mockRpc.mockResolvedValue({ data: null, error: { message: "rpc failed" } })

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
    const body = (await response.json()) as {
      data: { success: boolean; auditStatus: string; warnings: string[] }
    }

    expect(response.status).toBe(200)
    expect(body.data.success).toBe(true)
    expect(body.data.auditStatus).toBe("degraded")
    expect(body.data.warnings).toEqual(["notification_audit", "audit_logs", "admin_actions"])
  })
})
