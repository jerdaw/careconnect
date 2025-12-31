import { type NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { createServerClient } from "@supabase/ssr"
import { env } from "@/lib/env"

// Initialize Internationalization Middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase Session
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Refresh session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Internationalization (Run after auth check)
  const intlResponse = intlMiddleware(request)

  // 3. Protected Route Logic
  const { pathname } = request.nextUrl
  const isProtectedRoute = pathname.includes("/dashboard") || pathname.includes("/admin")

  if (isProtectedRoute && !user) {
    // Redirect to login, preserving the intended destination if possible
    // Note: We need to handle localized paths (e.g. /en/dashboard)
    const locale = pathname.split("/")[1] || "en"
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return intlResponse
}

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(fr|en)/:path*"],
}
