import { describe, expect, it } from "vitest"
import { DEFAULT_AUTH_REDIRECT, safeRelativeRedirect } from "@/lib/auth/redirect"

describe("safeRelativeRedirect", () => {
  const baseUrl = "https://careconnect.ing"

  it("preserves legitimate same-origin paths, queries, and fragments", () => {
    expect(safeRelativeRedirect("/fr/dashboard?tab=services#current", baseUrl)).toBe(
      "/fr/dashboard?tab=services#current"
    )
  })

  it.each(["https://example.org/admin", "//example.org/admin", "/\\example.org/admin", "/dashboard\u0000admin"])(
    "rejects unsafe redirect value %s",
    (value) => {
      expect(safeRelativeRedirect(value, baseUrl)).toBe(DEFAULT_AUTH_REDIRECT)
    }
  )

  it("fails closed when the configured base URL is invalid", () => {
    expect(safeRelativeRedirect("/en/admin", "not-a-url")).toBe(DEFAULT_AUTH_REDIRECT)
  })
})
