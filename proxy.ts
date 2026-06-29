import { type NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"

// Initialize Internationalization Middleware
const intlMiddleware = createMiddleware(routing)
const authCallbackLocales = new Set(routing.locales)

function isAuthCallbackPath(pathname: string) {
  if (pathname === "/auth/callback" || pathname === "/auth/callback/") {
    return true
  }

  const segments = pathname.split("/").filter(Boolean)
  return (
    segments.length === 3 &&
    authCallbackLocales.has(segments[0] as (typeof routing.locales)[number]) &&
    segments[1] === "auth" &&
    segments[2] === "callback"
  )
}

function applyResponseCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    const { name, value, ...options } = cookie
    target.cookies.set(name, value, options)
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isAuthCallbackPath(pathname)) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

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
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session if needed
  let user = null
  try {
    if (env.NODE_ENV === "test") {
      logger.info("Skipping Supabase auth refresh in proxy during tests", {
        component: "proxy",
      })
    } else {
      const { data } = await supabase.auth.getUser()
      user = data.user
    }
  } catch (error) {
    logger.warn("Proxy auth refresh failed", {
      component: "proxy",
      error: error instanceof Error ? error.message : String(error),
    })
  }

  // 2. Internationalization (Run after auth check)
  const intlResponse = intlMiddleware(request)

  // 3. Protected Route Logic
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
    const redirectResponse = NextResponse.redirect(loginUrl)
    applyResponseCookies(response, redirectResponse)
    return redirectResponse
  }

  applyResponseCookies(response, intlResponse)
  return intlResponse
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ["/((?!api|_next|_vercel|auth/callback|.*\\..*).*)"],
}
