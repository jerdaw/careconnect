import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

/**
 * GET /api/v1/services/[id]
 * 
 * Public endpoint to get a single service by ID.
 * 
 * Response:
 *   - 200: { data: Service }
 *   - 404: { error: "Service not found" }
 *   - 500: { error: string }
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return createApiError('Service ID is required', 400);
    }

    try {
        const { data, error } = await supabase
            .from('services')
            .select('id, name, name_fr, description, description_fr, address, address_fr, phone, url, email, hours, fees, eligibility, application_process, languages, bus_routes, accessibility, category, verification_status, last_verified')
            .eq('id', id)
            .single();

        if (error || !data) {
            return createApiError('Service not found', 404);
        }

        const response = createApiResponse(data);

        // Cache individual service for 5 minutes
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

        return response;
    } catch (err) {
        return handleApiError(err);
    }
}

/**
 * PUT /api/v1/services/[id]
 * 
 * Protected endpoint to update a service.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { createServerClient } = await import('@supabase/ssr');
        const { cookies } = await import('next/headers');

        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: () => { },
                },
            }
        );

        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

        if (authError || !user) {
            return createApiError('Unauthorized', 401);
        }

        const body = await request.json() as any;

        // Prevent updating ID
        delete body.id;

        const { data, error } = await supabaseAuth
            .from('services')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return createApiError('Failed to update service', 500, error.message);
        }

        return createApiResponse(data);
    } catch (err) {
        return handleApiError(err);
    }
}

/**
 * DELETE /api/v1/services/[id]
 * 
 * Protected endpoint to delete a service.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { createServerClient } = await import('@supabase/ssr');
        const { cookies } = await import('next/headers');

        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: () => { },
                },
            }
        );

        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

        if (authError || !user) {
            return createApiError('Unauthorized', 401);
        }

        const { error } = await supabaseAuth
            .from('services')
            .delete()
            .eq('id', id);

        if (error) {
            return createApiError('Failed to delete service', 500, error.message);
        }

        return createApiResponse({ success: true });
    } catch (err) {
        return handleApiError(err);
    }
}
