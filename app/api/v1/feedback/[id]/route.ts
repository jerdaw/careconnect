import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const UpdateStatusSchema = z.object({
  status: z.enum(["pending", "reviewed", "resolved", "dismissed"]),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id: feedbackId } = await params

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // 2. Validate Request Body
    const body = await request.json()
    const validation = UpdateStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 })
    }

    const { status } = validation.data

    // 3. Verify Ownership (Strict Check)
    // Fetch feedback and associated service's org_id
    // We use a raw query or join. Since we need to verify the service owner,
    // we assume strict RLS might block us if we just try to update blindly.
    // However, to be safe and give explicit 403, we check manually.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: feedback, error: fetchError } = await (supabase.from("feedback") as any)
      .select(
        `
        id,
        service_id,
        services (
          org_id
        )
      `
      )
      .eq("id", feedbackId)
      .single()

    if (fetchError || !feedback) {
      return NextResponse.json({ success: false, message: "Feedback not found" }, { status: 404 })
    }

    const service = feedback.services as unknown as { org_id: string } | null

    // Check if the authenticated user owns the service
    if (!service || service.org_id !== user.id) {
      return NextResponse.json({ success: false, message: "Forbidden: You do not own this service" }, { status: 403 })
    }

    // 4. Update Status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from("feedback") as any)
      .update({
        status: status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
        resolved_by: user.email, // Store email for audit
      })
      .eq("id", feedbackId)

    if (updateError) {
      return NextResponse.json({ success: false, message: "Failed to update feedback" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Feedback updated" })
  } catch (error) {
    console.error("Feedback PATCH error:", error)
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
  }
}
