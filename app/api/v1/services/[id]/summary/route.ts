import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: serviceId } = await params
  const supabase = await createClient()

  if (!serviceId) {
    return NextResponse.json({ success: false, message: "Service ID is required" }, { status: 400 })
  }

  // Fetch summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: summary, error } = await (supabase.from("plain_language_summaries" as any) as any)
    .select("*")
    .eq("service_id", serviceId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // Not found codes
      return NextResponse.json({ success: false, message: "Summary not found" }, { status: 404 })
    }
    logger.error("Error fetching summary", error, {
      component: "api-service-summary",
      action: "GET",
      serviceId,
    })
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: summary })
}
