/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"

const { mockIntlHandler, mockGetUser } = vi.hoisted(() => ({
  mockIntlHandler: vi.fn((request: NextRequest) =>
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  ),
  mockGetUser: vi.fn(),
}))

vi.mock("next-intl/middleware", () => ({
  default: vi.fn(() => mockIntlHandler),
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(
    (_url: string, _key: string, options: { cookies: { setAll: (cookies: unknown[]) => void } }) => ({
      auth: {
        getUser: vi.fn(async () => {
          options.cookies.setAll([
            {
              name: "sb-access-token",
              value: "refreshed-token",
              options: { path: "/", httpOnly: true },
            },
          ])
          return mockGetUser()
        }),
      },
    })
  ),
}))

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
    NODE_ENV: "production",
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

import { middleware } from "@/middleware"

describe("middleware auth cookie propagation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })
  })

  it("copies refreshed auth cookies onto the intl response", async () => {
    const request = new NextRequest("http://localhost:3000/en")

    const response = await middleware(request)

    expect(mockIntlHandler).toHaveBeenCalled()
    expect(response.cookies.get("sb-access-token")?.value).toBe("refreshed-token")
  })

  it("preserves refreshed auth cookies when redirecting protected routes", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest("http://localhost:3000/en/dashboard")
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/en/login")
    expect(response.headers.get("location")).toContain("next=%2Fen%2Fdashboard")
    expect(response.cookies.get("sb-access-token")?.value).toBe("refreshed-token")
  })
})
