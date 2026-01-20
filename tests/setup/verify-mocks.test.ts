import { describe, it, expect, vi } from "vitest"
import "./next-mocks"

describe("Mock Setup Verification", () => {
  it("next/headers is mocked", async () => {
    const { cookies, headers } = await import("next/headers")
    expect(vi.isMockFunction(cookies)).toBe(true)
    expect(vi.isMockFunction(headers)).toBe(true)

    const cookieStore = await cookies()
    expect(cookieStore.getAll()).toEqual([])
  })

  it("@supabase/ssr is mocked", async () => {
    const { createServerClient } = await import("@supabase/ssr")
    expect(vi.isMockFunction(createServerClient)).toBe(true)

    const client = createServerClient("url", "key", {
      cookies: {
        get: (_name) => "",
        set: (_name, _value, _options) => {},
        remove: (_name, _options) => {},
      },
    })
    expect(client.auth).toBeDefined()
    expect(vi.isMockFunction(client.auth.getUser)).toBe(true)

    const user = await client.auth.getUser()
    expect(user.data.user?.id).toBe("test-user-id")
  })
})
