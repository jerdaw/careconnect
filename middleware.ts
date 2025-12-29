import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { createServerClient } from '@supabase/ssr';

// Initialize Internationalization Middleware
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
    // 1. Refresh Supabase Session
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if needed
    const {
        data: { user },
    } = await supabase.auth.getUser();


    // 2. Internationalization (Run after auth check)
    // We pass the potentially modified request/response to next-intl
    // Note: next-intl middleware returns a response. We might need to copy over cookies 
    // if supabase refreshed them. Using a chained approach or merged response is tricky. 
    // Standard pattern: Run Supabase first, then return intlMiddleware(request) if public.

    // For now, simple composition:
    return intlMiddleware(request);

    // TODO: Add Protected Route Logic here later
    // if (request.nextUrl.pathname.startsWith('/dashboard') && !user) { ... }
}

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(fr|en)/:path*']
};
