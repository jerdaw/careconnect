import { describe, it, expect } from "vitest"
import { createApiResponse, createApiError, handleApiError, ApiResponse } from "../../lib/api-utils"

interface ApiErrorBody {
  error: {
    message: string
    code: number
    details?: unknown
  }
  meta: {
    timestamp: string
    requestId: string
  }
}

describe("API Utils", () => {
  it("should create success response", async () => {
    const data = { foo: "bar" }
    const response = createApiResponse(data)
    const body = (await response.json()) as ApiResponse

    expect(response.status).toBe(200)
    expect(body.data).toEqual(data)
    expect(body.meta).toMatchObject({
      timestamp: expect.any(String),
      requestId: expect.any(String),
    })
  })

  it("should create error response", async () => {
    const errorResponse = createApiError("Something went wrong", 400)
    const body = (await errorResponse.json()) as ApiErrorBody

    expect(errorResponse.status).toBe(400)
    expect(body.error).toEqual({
      message: "Something went wrong",
      code: 400,
      details: undefined,
    })
    expect(body.meta).toMatchObject({
      timestamp: expect.any(String),
      requestId: expect.any(String),
    })
  })

  it("does not expose generic internal error details in 500 responses", async () => {
    const errorResponse = handleApiError(new Error("database password leaked in stack context"))
    const body = (await errorResponse.json()) as ApiErrorBody

    expect(errorResponse.status).toBe(500)
    expect(body.error.message).toBe("Internal Server Error")
    expect(JSON.stringify(body)).not.toContain("database password")
  })

  it("maps JSON parse errors to bad request responses", async () => {
    const errorResponse = handleApiError(new SyntaxError("Unexpected token n in JSON at position 1"))
    const body = (await errorResponse.json()) as ApiErrorBody

    expect(errorResponse.status).toBe(400)
    expect(body.error.message).toBe("Invalid JSON")
  })
})
