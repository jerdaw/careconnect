import { NextRequest } from "next/server"
import { createApiError, createApiResponse, handleApiError, validateContentType } from "@/lib/api-utils"
import { getClientIp, checkRateLimit } from "@/lib/rate-limit"
import { requireAuthenticatedUser } from "@/lib/pilot/auth"
import { PilotMetricsRecomputeSchema } from "@/lib/schemas/pilot-events"
import { assertPermission } from "@/lib/auth/authorization"
import { recomputePilotMetrics } from "@/lib/pilot/recompute"

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(getClientIp(request), 20, 60 * 1000, "api:v1:pilot:metrics:recompute")
    if (!rateLimit.success) {
      return createApiError("Rate limit exceeded", 429)
    }

    const auth = await requireAuthenticatedUser()
    if (auth.error || !auth.supabaseAuth || !auth.user) {
      return auth.error ?? createApiError("Unauthorized", 401)
    }

    validateContentType(request)
    const body = await request.json()
    const validation = PilotMetricsRecomputeSchema.safeParse(body)

    if (!validation.success) {
      return createApiError("Invalid pilot recompute payload", 400, validation.error.flatten())
    }

    const payload = validation.data
    await assertPermission(auth.supabaseAuth, auth.user.id, payload.org_id, "canCreateServices")

    const recomputed = await recomputePilotMetrics(auth.supabaseAuth, payload.pilot_cycle_id, payload.org_id)
    if (recomputed.missingTables.length > 0) {
      return createApiError(`Pilot storage not ready: missing ${recomputed.missingTables.join(", ")}`, 501)
    }
    if (recomputed.error) {
      return createApiError("Failed to recompute pilot metrics", 500, recomputed.error.message)
    }

    return createApiResponse(
      {
        success: true,
        calculatedAt: recomputed.data?.calculatedAt ?? null,
        snapshotsWritten: recomputed.data?.snapshotsWritten ?? 0,
        scorecard: recomputed.data?.scorecard ?? null,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
