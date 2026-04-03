import { describe, expect, it } from "vitest"
import { validateRuntimeSecurityHeaders } from "@/lib/security/security-headers"

function createHeaders(includeAll = true) {
  const headers = new Headers({
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://onesignal.com https://cdn.onesignal.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  })

  if (!includeAll) {
    headers.delete("X-Frame-Options")
  }

  return headers
}

describe("runtime security header validation", () => {
  it("passes when all checked paths expose the required headers", async () => {
    const fetchImpl: typeof fetch = async (input) =>
      new Response("ok", {
        status: String(input).includes("/api/v1/health") ? 503 : 200,
        headers: createHeaders(),
      })

    const result = await validateRuntimeSecurityHeaders({
      baseUrl: "https://careconnect.ing",
      paths: ["/en", "/api/v1/health"],
      fetchImpl,
    })

    expect(result.passed).toBe(true)
    expect(result.results).toHaveLength(2)
    expect(result.results.every((entry) => entry.passed)).toBe(true)
  })

  it("fails when one checked path is missing a required header", async () => {
    const fetchImpl: typeof fetch = async (input) =>
      new Response("ok", {
        status: 200,
        headers: String(input).includes("/en") ? createHeaders(false) : createHeaders(),
      })

    const result = await validateRuntimeSecurityHeaders({
      baseUrl: "https://careconnect.ing",
      paths: ["/en", "/api/v1/health"],
      fetchImpl,
    })

    expect(result.passed).toBe(false)
    expect(result.results.find((entry) => entry.path === "/en")?.passed).toBe(false)
    expect(result.results.find((entry) => entry.path === "/api/v1/health")?.passed).toBe(true)
  })

  it("fails clearly when the target cannot be fetched", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:3000")
    }

    const result = await validateRuntimeSecurityHeaders({
      baseUrl: "http://127.0.0.1:3000",
      paths: ["/en"],
      fetchImpl,
    })

    expect(result.passed).toBe(false)
    expect(result.results[0]?.error).toContain("ECONNREFUSED")
  })
})
