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
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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
  let user = null
  try {
    // Skip auth check if using placeholder (CI/Test)
    if (env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
       console.log("Skipping Supabase auth in middleware (Testing Mode)")
    } else {
      const { data } = await supabase.auth.getUser()
      user = data.user
    }
  } catch (error) {
    console.warn("Middleware Auth Error (Non-blocking):", error)
  }

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
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
