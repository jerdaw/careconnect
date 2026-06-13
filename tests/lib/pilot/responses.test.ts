import { describe, expect, it, vi } from "vitest"
import { createPilotIdempotentRetryResponse, createPilotWriteSuccessResponse } from "@/lib/pilot/responses"

vi.mock("@/lib/logger", () => ({
  generateErrorId: vi.fn(() => "req-test"),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

describe("pilot API responses", () => {
  it("creates a no-store write success response", async () => {
    const response = createPilotWriteSuccessResponse()
    const json = (await response.json()) as { data: unknown }

    expect(response.status).toBe(201)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(json.data).toEqual({ success: true })
  })

  it("creates a no-store idempotent retry response", async () => {
    const response = createPilotIdempotentRetryResponse()
    const json = (await response.json()) as { data: unknown }

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(json.data).toEqual({ success: true, duplicate: true })
  })
})
