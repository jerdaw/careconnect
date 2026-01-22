import "../../setup/next-mocks"
import { describe, it, expect } from "vitest"
import { POST } from "@/app/api/v1/share/route"

describe("Share Target V1 API Route", () => {
  it("redirects to home with shared text as query", async () => {
    const formData = new FormData()
    formData.set("text", "food bank")

    const request = {
      url: "http://localhost/api/v1/share",
      formData: async () => formData,
    } as any as Request

    const response = await POST(request)
    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe("http://localhost/?q=food%20bank")
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
    expect(response.headers.get("location")).toBe("http://localhost/?q=Crisis%20resources")
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
  })
})
