import { NextResponse } from "next/server"
import { trackSearchEvent } from "@/lib/analytics/search-analytics"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { validateContentType, ValidationError } from "@/lib/api-utils"
import { SUPPORTED_LOCALES } from "@/lib/schemas/search"

// Input Validation
const analyticsSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  resultCount: z.number().int().min(0),
})

const ANALYTICS_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
} as const

export async function POST(req: Request) {
  try {
    validateContentType(req)

    // Check if body is empty
    const text = await req.text()
    if (!text) {
      return NextResponse.json({ success: true, skipped: "empty_body" }, { headers: ANALYTICS_HEADERS })
    }

    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: ANALYTICS_HEADERS })
    }

    // Validate input
    const validation = analyticsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: ANALYTICS_HEADERS })
    }

    const { locale, resultCount } = validation.data

    // Log event safely (never logs query text)
    await trackSearchEvent({
      locale,
      resultCount,
    })

    return NextResponse.json({ success: true }, { headers: ANALYTICS_HEADERS })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 415, headers: ANALYTICS_HEADERS })
    }

    logger.error("Analytics API error", err, {
      component: "api-analytics-search",
      action: "POST",
    })
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: ANALYTICS_HEADERS })
  }
}
