import { describe, it, expect } from "vitest"
import { createApiResponse, createApiError, ApiResponse } from "../../lib/api-utils"

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
    const body = (await errorResponse.json()) as any // Using any for error structure ease

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
})
