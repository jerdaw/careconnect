import { type NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { createServerClient } from "@supabase/ssr"
import { env } from "@/lib/env"

// Initialize Internationalization Middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value
  const preferredLocale =
    cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale) ? cookieLocale : routing.defaultLocale

  // Ensure Workbox navigation fallback (`/offline`) resolves to a real page.
  // We rewrite (not redirect) so the response is cached under `/offline`.
  if (request.nextUrl.pathname === "/offline") {
    const url = request.nextUrl.clone()
    url.pathname = `/${preferredLocale}/offline`
    return NextResponse.rewrite(url)
  }

  // 1. Refresh Supabase Session
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return intlMiddleware(request)
  }

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: any }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session if needed
  let user = null
  try {
    // Skip auth check if using placeholder (CI/Test)
    if (env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
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
    const segments = pathname.split("/").filter(Boolean)
    const firstSegment = segments[0]
    const locale =
      firstSegment && (routing.locales as readonly string[]).includes(firstSegment) ? firstSegment : preferredLocale

    const loginUrl = new URL(`/${locale}/login`, request.url)
    const nextPath =
      firstSegment && (routing.locales as readonly string[]).includes(firstSegment) ? pathname : `/${locale}${pathname}`
    loginUrl.searchParams.set("next", nextPath)
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
