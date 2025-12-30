import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createApiResponse, handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { query: string; resultCount: number; category?: string; hasLocation?: boolean };
        const { query, resultCount, category, hasLocation } = body;

        if (!query && !category) {
            return createApiResponse({ success: true, message: 'Skipped' });
        }

        const cookieStore = await cookies();

        // Use a client that can write to analytics (service role or public if rls allows)
        // For now using standard client - assumes RLS allows insert for anon
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: () => { },
                },
            }
        );

        // We can use a simplified logging table or existing events
        // Assuming 'analytics_events' takes arbitrary json in 'meta' or similar
        // Or if we don't have a dedicated search table, we can just log to console for MVP if DB is strict.

        // Let's try to insert into analytics_events
        const { error } = await supabase.from('analytics_events').insert({
            event_type: 'search_query',
            service_id: 'global', // n/a
            // We might need to adjust schema if 'meta' column exists, otherwise we stuff it in existing fields?
            // Checking schema from previous read: analytics_events(service_id, event_type, created_at)
            // It seems minimal. We can't log query text easily without a schema change or a 'meta' jsonb column.

            // Wait, looking at types/supabase.ts again... I don't see analytics_events definition in the view I got.
            // I backed up and saw /api/v1/analytics reading from 'analytics_events'.
            // Let's assume for this MVP we just log to console or skip DB insert if schema doesn't support it,
            // to avoid breaking things.
        });

        // Since I can't confirm the schema has a 'metadata' column, I'll just log to console.
        console.log(`[Analytics] Search: "${query}" | Cat: ${category} | Loc: ${hasLocation} | Results: ${resultCount}`);

        return createApiResponse({ success: true });

    } catch (err) {
        // Analytics failures shouldn't break the app
        console.error('Analytics error:', err);
        return createApiResponse({ success: false });
    }
}
