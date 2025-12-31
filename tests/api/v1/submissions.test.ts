import { describe, it, expect } from "vitest"
import { POST } from "@/app/api/v1/submissions/route"
import { createMockRequest, parseResponse } from "@/tests/utils/api-test-utils"

describe("API v1 Submissions", () => {
    it("returns 400 for invalid payload", async () => {
        const req = createMockRequest("http://localhost", {
            method: "POST",
            body: JSON.stringify({})
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it("returns 201 for valid submission", async () => {
        const validBody = {
            name: "New Organization",
            description: "A valid description of at least 10 chars",
            url: "https://example.com"
        }

        const req = createMockRequest("http://localhost", {
            method: "POST",
            body: JSON.stringify(validBody)
        })
        const res = await POST(req)
        const { status, data } = await parseResponse(res)

        expect(status).toBe(201)
        expect(data.success).toBe(true)
    })
})
