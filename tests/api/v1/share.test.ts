import "../../setup/next-mocks"
import { describe, it, expect } from "vitest"
import { POST } from "@/app/api/v1/share/route"
import { SHARE_TARGET_QUERY_COOKIE_NAME } from "@/lib/share-target"

describe("Share Target V1 API Route", () => {
  it("redirects to home and stores the shared query in a short-lived cookie", async () => {
    const formData = new FormData()
    formData.set("text", "food bank")

    const request = {
      url: "http://localhost/api/v1/share",
      formData: async () => formData,
    } as any as Request

    const response = await POST(request)
    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe("http://localhost/")
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(response.headers.get("set-cookie")).toContain(`${SHARE_TARGET_QUERY_COOKIE_NAME}=`)
    expect(response.headers.get("set-cookie")).toContain("Max-Age=60")
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax")
  })

  it("falls back to title when text is missing", async () => {
    const formData = new FormData()
    formData.set("title", "Crisis resources")

    const request = {
      url: "http://localhost/api/v1/share",
      formData: async () => formData,
    } as any as Request

    const response = await POST(request)
    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe("http://localhost/")
    expect(response.headers.get("set-cookie")).toContain(`${SHARE_TARGET_QUERY_COOKIE_NAME}=`)
  })

  it("redirects to home on invalid form data", async () => {
    const request = new Request("http://localhost/api/v1/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "ignored" }),
    })

    const response = await POST(request)
    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe("http://localhost/")
    expect(response.headers.get("Cache-Control")).toBe("no-store")
  })
})
