import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { NotificationCategory } from "@/types/notifications"

export async function POST(req: NextRequest) {
    try {
        const { subscription, categories, locale } = await req.json() as {
            subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
            categories: NotificationCategory[],
            locale: string
        }

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Check if subscription already exists (by endpoint)
        const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('endpoint', subscription.endpoint)
            .single()

        let error;

        if (existing) {
            // Update existing
            const { error: updateError } = await (supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from('push_subscriptions') as any)
                .update({
                    categories,
                    keys: subscription.keys, // Ensure keys are fresh
                    locale,
                    updated_at: new Date().toISOString()
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .eq('id', (existing as any).id)
            error = updateError;
        } else {
            // Insert new
            const { error: insertError } = await (supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from('push_subscriptions') as any)
                .insert({
                    endpoint: subscription.endpoint,
                    keys: subscription.keys,
                    categories,
                    locale
                })
            error = insertError;
        }

        if (error) {
            console.error("Database error:", error)
            return NextResponse.json({ error: "Database error" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Subscribe server error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
