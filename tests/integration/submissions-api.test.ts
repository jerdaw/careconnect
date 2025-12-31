import { describe, it, expect } from "vitest"
import { POST } from "@/app/api/v1/submissions/route"

describe("Submission API", () => {
  it("validates correct payload", async () => {
    const req = new Request("http://localhost/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify({
        name: "Valid Service",
        description: "This is a valid service description that meets the length requirement.",
        phone: "555-0123",
      }),
    })

    const res = await POST(req)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any

    expect(res.status).toBe(201)
    expect(data.success).toBe(true)
  })

  it("rejects invalid payload (short name)", async () => {
    const req = new Request("http://localhost/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify({
        name: "No",
        description: "Valid description here.",
      }),
    })

    const res = await POST(req)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(data.error).toBeDefined()
    expect(data.error.fieldErrors.name).toBeDefined()
  })

  it("rejects invalid payload (short description)", async () => {
    const req = new Request("http://localhost/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify({
        name: "Valid Name",
        description: "Short",
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
