import { type NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import {
  PUBLIC_SERVICE_MODE,
  decidePublicServiceRoute,
  isPublicServiceRetired,
  type PublicServiceMode,
} from "@/lib/public-service-mode"

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

export async function proxy(request: NextRequest, publicServiceMode: PublicServiceMode = PUBLIC_SERVICE_MODE) {
  const { pathname } = request.nextUrl

  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value
  const preferredLocale =
    cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale) ? cookieLocale : routing.defaultLocale
  const publicServiceDecision = decidePublicServiceRoute(pathname, preferredLocale, publicServiceMode)

  if (publicServiceDecision.action === "gone") {
    return NextResponse.json(
      {
        error: "The CareConnect public directory has been retired.",
      },
      {
        status: 410,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      }
    )
  }

  if (publicServiceDecision.action === "rewrite") {
    const url = request.nextUrl.clone()
    url.pathname = publicServiceDecision.pathname
    url.search = ""

    const retirementResponse = NextResponse.rewrite(url)
    retirementResponse.headers.set("Cache-Control", "no-store, max-age=0")
    retirementResponse.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
    return retirementResponse
  }

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (isPublicServiceRetired(publicServiceMode)) {
    const retirementResponse = intlMiddleware(request)
    retirementResponse.headers.set("Cache-Control", "no-store, max-age=0")
    retirementResponse.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
    return retirementResponse
  }

  if (isAuthCallbackPath(pathname)) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

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
  // API routes must be matched explicitly so a dotted suffix cannot bypass
  // the retirement 410 contract. The general route keeps genuine static
  // assets, `/_next`, and `/_vercel` outside proxy work.
  matcher: ["/api/:path*", "/((?!api(?:/|$)|_next|_vercel|.*\\..*).*)"],
}
