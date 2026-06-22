"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { hasSupabaseCredentials, supabase } from "@/lib/supabase"

function safeRelativeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/en/dashboard"
  }

  return value
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => safeRelativeRedirect(searchParams.get("next")), [searchParams])
  const [status, setStatus] = useState("Completing sign in...")

  useEffect(() => {
    let cancelled = false

    const completeSignIn = async () => {
      if (!hasSupabaseCredentials()) {
        router.replace("/en/login?error=auth_unavailable")
        return
      }

      const code = searchParams.get("code")
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          if (!cancelled) {
            setStatus("Unable to complete sign in.")
            router.replace("/en/login?error=auth_callback")
          }
          return
        }
      }

      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)

          if (error) {
            if (!cancelled) {
              setStatus("Unable to complete sign in.")
              router.replace("/en/login?error=auth_callback")
            }
            return
          }
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) {
        return
      }

      if (session) {
        router.replace(nextPath)
        return
      }

      setStatus("Unable to complete sign in.")
      router.replace("/en/login?error=auth_callback")
    }

    void completeSignIn()

    return () => {
      cancelled = true
    }
  }, [nextPath, router, searchParams])

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
      <p className="text-sm font-medium">{status}</p>
    </main>
  )
}
