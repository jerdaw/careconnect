/**
 * Scheduled job to export metrics to Axiom
 *
 * Vercel Cron: https://vercel.com/docs/cron-jobs
 *
 * Schedule: Every hour (0 * * * *)
 */

import { NextRequest, NextResponse } from "next/server"
import { exportMetricsToAxiom } from "@/lib/performance/metrics"
import { sendHealthCheck } from "@/lib/observability/axiom"
import { logger } from "@/lib/logger"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this header)
  const authHeader = request.headers.get("authorization")
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    logger.warn("Unauthorized cron request", {
      component: "cron",
      hasAuth: !!authHeader,
      hasSecret: !!process.env.CRON_SECRET,
    })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Export performance metrics
    await exportMetricsToAxiom()

    // Export health check status
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const healthResponse = await fetch(`${appUrl}/api/v1/health`, {
      headers: {
        "User-Agent": "Vercel-Cron/1.0",
      },
    })

    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      await sendHealthCheck(healthData)
    } else {
      logger.error("Health check failed", {
        status: healthResponse.status,
        statusText: healthResponse.statusText,
        component: "cron",
      })
    }

    logger.info("Metrics exported to Axiom", { component: "cron" })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Metric export failed", {
      error: error instanceof Error ? error.message : String(error),
      component: "cron",
    })

    return NextResponse.json(
      {
        error: "Export failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
