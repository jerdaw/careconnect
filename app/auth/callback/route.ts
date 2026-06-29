import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const SUPPORTED_LOCALES = new Set(["en", "fr", "zh-Hans", "ar", "pt", "es", "pa"])

function safeRelativeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/en/dashboard"
  }

  return value
}

function localeFromPath(pathname: string): string {
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  return firstSegment && SUPPORTED_LOCALES.has(firstSegment) ? firstSegment : "en"
}

function loginRedirect(request: NextRequest, error: string) {
  const url = new URL(`/${localeFromPath(request.nextUrl.pathname)}/login`, request.url)
  url.searchParams.set("error", error)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")

  if (!code) {
    return loginRedirect(request, "auth_callback")
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return loginRedirect(request, "auth_callback")
    }
  } catch {
    return loginRedirect(request, "auth_callback")
  }

  return NextResponse.redirect(new URL(safeRelativeRedirect(request.nextUrl.searchParams.get("next")), request.url))
}
