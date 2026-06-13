import { createApiResponse } from "@/lib/api-utils"

const PILOT_NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const

export function createPilotWriteSuccessResponse(status = 201) {
  return createApiResponse({ success: true }, { status, headers: PILOT_NO_STORE_HEADERS })
}

export function createPilotIdempotentRetryResponse() {
  return createApiResponse({ success: true, duplicate: true }, { status: 200, headers: PILOT_NO_STORE_HEADERS })
}
