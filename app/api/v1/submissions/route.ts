import { NextResponse } from "next/server"


import { SubmissionSchema } from "@/types/submission"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const parsed = SubmissionSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        // MOCK DB INSERTION
        // Since Supabase isn't configured, we mimic a successful saved state.
        // In production, this would be: await supabase.from("submissions").insert(...)
        console.log("📝 [MOCK] Saving submission:", parsed.data)

        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, 800))

        return NextResponse.json({ success: true, id: "mock-id-123" }, { status: 201 })
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
