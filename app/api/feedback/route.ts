import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const FeedbackSchema = z.object({
  serviceId: z.string().min(1),
  feedbackType: z.enum(["wrong_phone", "wrong_address", "service_closed", "other"]),
  message: z.string().max(1000).optional(),
})

export async function POST(request: Request) {
  const json = await request.json()
  const parsed = FeedbackSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("feedback") as any).insert({
    service_id: parsed.data.serviceId,
    feedback_type: parsed.data.feedbackType,
    message: parsed.data.message,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
