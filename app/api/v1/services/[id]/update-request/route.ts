import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const UpdateRequestSchema = z.object({
  field_updates: z.record(z.any()),
  justification: z.string().max(500).optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: serviceId } = await params
  const supabase = await createClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { field_updates, justification } = UpdateRequestSchema.parse(body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("service_update_requests" as any) as any).insert({
      service_id: serviceId,
      requested_by: user.email,
      field_updates,
      justification,
      status: "pending",
    })

    if (error) {
      console.error("Error creating update request:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Update request submitted" })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid update data", errors: err.flatten() },
        { status: 400 }
      )
    }
    console.error("Unexpected error in update request route:", err)
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
  }
}
