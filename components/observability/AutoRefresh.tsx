"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface AutoRefreshProps {
  intervalMs?: number
}

export function AutoRefresh({ intervalMs = 60000 }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const shouldRefresh = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return false
      if (typeof navigator !== "undefined" && !navigator.onLine) return false
      return true
    }

    const refreshIfActive = () => {
      if (shouldRefresh()) {
        router.refresh()
      }
    }

    const interval = setInterval(() => {
      refreshIfActive()
    }, intervalMs)

    const onVisible = () => {
      refreshIfActive()
    }

    window.addEventListener("online", onVisible)
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      clearInterval(interval)
      window.removeEventListener("online", onVisible)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [router, intervalMs])

  return null
}
