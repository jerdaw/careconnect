import { NextResponse } from "next/server"
import { trackSearchEvent } from "@/lib/analytics/search-analytics"
import { z } from "zod"

// Input Validation
const analyticsSchema = z.object({
  category: z.string().nullable().optional(),
  resultCount: z.number().int().min(0),
  hasLocation: z.boolean(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate input
    const validation = analyticsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const { category, resultCount, hasLocation } = validation.data

    // Log event safely (never logs query text)
    await trackSearchEvent({
      category: category || null,
      resultCount,
      hasLocation,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Analytics API Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
