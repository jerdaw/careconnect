/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "@/app/auth/callback/route"

const { mockExchangeCodeForSession } = vi.hoisted(() => ({
  mockExchangeCodeForSession: vi.fn(),
}))

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}))

describe("auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: null })
  })

  it("exchanges a PKCE code and redirects to the safe next path", async () => {
    const request = new NextRequest("https://careconnect.ing/en/auth/callback?code=test-code&next=%2Fen%2Fadmin")

    const response = await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("test-code")
    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("https://careconnect.ing/en/admin")
  })

  it("uses the public app URL instead of an internal reverse-proxy origin", async () => {
    const request = new NextRequest("https://0.0.0.0:3000/en/auth/callback?code=test-code&next=%2Fen%2Fadmin")

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("https://careconnect.ing/en/admin")
  })

  it("falls back to the localized login page when the exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: new Error("exchange failed") })
    const request = new NextRequest("https://careconnect.ing/fr/auth/callback?code=test-code&next=%2Ffr%2Fadmin")

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("https://careconnect.ing/fr/login?error=auth_callback")
  })

  it("rejects callback requests without a code", async () => {
    const request = new NextRequest("https://careconnect.ing/en/auth/callback?next=%2Fen%2Fadmin")

    const response = await GET(request)

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("https://careconnect.ing/en/login?error=auth_callback")
  })

  it("does not redirect to absolute or protocol-relative next paths", async () => {
    const request = new NextRequest(
      "https://careconnect.ing/en/auth/callback?code=test-code&next=https%3A%2F%2Fexample.org%2Fadmin"
    )

    const response = await GET(request)

    expect(response.headers.get("location")).toBe("https://careconnect.ing/en/dashboard")
  })
})
