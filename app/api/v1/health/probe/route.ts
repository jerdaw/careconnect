import { NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/env"
import { getHealthSnapshot, checkAndAlertSLOViolations } from "@/lib/observability/health-check"
import { recordUptimeEvent } from "@/lib/observability/slo-tracker"

function isAuthorizedProbe(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const expectedToken = env.HEALTH_PROBE_TOKEN

  if (!expectedToken) {
    return false
  }

  return authHeader === `Bearer ${expectedToken}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedProbe(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const snapshot = await getHealthSnapshot()
  recordUptimeEvent(snapshot.isHealthy)
  void checkAndAlertSLOViolations(snapshot.sloCompliance)

  const statusCode = snapshot.overallStatus === "unhealthy" ? 503 : 200

  return NextResponse.json(snapshot.detailedResponse, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json",
    },
  })
}
