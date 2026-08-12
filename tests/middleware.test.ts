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

import { config, proxy } from "@/proxy"

describe("proxy auth cookie propagation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })
  })

  it("copies refreshed auth cookies onto the intl response", async () => {
    const request = new NextRequest("http://localhost:3000/en")

    const response = await proxy(request, "active")

    expect(mockIntlHandler).toHaveBeenCalled()
    expect(response.cookies.get("sb-access-token")?.value).toBe("refreshed-token")
  })

  it("preserves refreshed auth cookies when redirecting protected routes", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest("http://localhost:3000/en/dashboard")
    const response = await proxy(request, "active")

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/en/login")
    expect(response.headers.get("location")).toContain("next=%2Fen%2Fdashboard")
    expect(response.cookies.get("sb-access-token")?.value).toBe("refreshed-token")
  })

  it("does not localize the Supabase auth callback route", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback?next=%2Fen%2Fadmin")

    const response = await proxy(request, "active")

    expect(mockIntlHandler).not.toHaveBeenCalled()
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(response.headers.get("location")).toBeNull()
  })

  it("does not localize the localized Supabase auth callback route", async () => {
    const request = new NextRequest("http://localhost:3000/en/auth/callback?next=%2Fen%2Fadmin")

    const response = await proxy(request, "active")

    expect(mockIntlHandler).not.toHaveBeenCalled()
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(response.headers.get("location")).toBeNull()
  })

  it("keeps active API requests outside auth and localization work", async () => {
    const request = new NextRequest("http://localhost:3000/api/v1/services")
    const response = await proxy(request, "active")

    expect(response.headers.get("x-middleware-next")).toBe("1")
    expect(mockIntlHandler).not.toHaveBeenCalled()
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it("matches every API path separately while retaining static-asset exclusions", () => {
    expect(config.matcher).toContain("/api/:path*")
    expect(config.matcher.join(" ")).toContain(".*\\..*")
    expect(config.matcher.join(" ")).toContain("_next")
  })
})

describe("proxy retirement routing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rewrites the public home page without refreshing auth", async () => {
    const request = new NextRequest("http://localhost:3000/en?q=crisis")
    const response = await proxy(request)

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/en/retired")
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0")
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive")
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(mockIntlHandler).not.toHaveBeenCalled()
  })

  it("preserves a supported path locale when hiding a former service route", async () => {
    const request = new NextRequest("http://localhost:3000/fr/service/stale-record")
    const response = await proxy(request)

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/fr/retired")
  })

  it("uses the locale cookie for an unlocalized route", async () => {
    const request = new NextRequest("http://localhost:3000/about", {
      headers: { cookie: "NEXT_LOCALE=pa" },
    })
    const response = await proxy(request)

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/pa/retired")
  })

  it("returns 410 without data or auth work for non-health APIs", async () => {
    const request = new NextRequest("http://localhost:3000/api/v1/services?limit=1")
    const response = await proxy(request)

    expect(response.status).toBe(410)
    expect(await response.json()).toEqual({ error: "The CareConnect public directory has been retired." })
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0")
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(mockIntlHandler).not.toHaveBeenCalled()
  })

  it("returns 410 for a dotted non-health API path", async () => {
    const request = new NextRequest("http://localhost:3000/api/v1/services/foo.json")
    const response = await proxy(request)

    expect(response.status).toBe(410)
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0")
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(mockIntlHandler).not.toHaveBeenCalled()
  })

  it.each(["/api/health", "/api/v1/health", "/api/v1/health/probe"])(
    "preserves the existing health route %s",
    async (pathname) => {
      const request = new NextRequest(`http://localhost:3000${pathname}`)
      const response = await proxy(request)

      expect(response.headers.get("x-middleware-next")).toBe("1")
      expect(mockGetUser).not.toHaveBeenCalled()
      expect(mockIntlHandler).not.toHaveBeenCalled()
    }
  )

  it("does not loop when the localized retirement route is requested directly", async () => {
    const request = new NextRequest("http://localhost:3000/ar/retired")
    const response = await proxy(request)

    expect(response.headers.get("x-middleware-rewrite")).toBeNull()
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive")
    expect(mockIntlHandler).toHaveBeenCalledOnce()
    expect(mockGetUser).not.toHaveBeenCalled()
  })
})
