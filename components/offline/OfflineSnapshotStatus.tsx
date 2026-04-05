"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Clock3 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { getMeta } from "@/lib/offline/db"
import {
  formatOfflineSnapshotAge,
  formatOfflineSnapshotTimestamp,
  getOfflineSnapshotStatus,
} from "@/lib/offline/snapshot"
import { cn } from "@/lib/utils"

interface OfflineSnapshotStatusProps {
  variant?: "banner" | "card"
  className?: string
}

export function OfflineSnapshotStatus({ variant = "card", className }: OfflineSnapshotStatusProps) {
  const t = useTranslations("Offline")
  const locale = useLocale()
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadSnapshotStatus = async () => {
      try {
        const value = await getMeta<string>("lastSync")
        if (!cancelled) {
          setLastSync(value ?? null)
        }
      } finally {
        if (!cancelled) {
          setIsLoaded(true)
        }
      }
    }

    void loadSnapshotStatus()

    return () => {
      cancelled = true
    }
  }, [])

  if (!isLoaded) {
    return null
  }

  const status = getOfflineSnapshotStatus(lastSync)
  const isStale = status === "stale"
  const Icon = isStale ? AlertTriangle : Clock3

  const containerClass =
    variant === "banner"
      ? "mt-1"
      : isStale
        ? "mt-4 w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-800 dark:bg-amber-900/20"
        : "mt-4 w-full max-w-md rounded-xl border border-neutral-200 bg-white p-4 text-left dark:border-neutral-800 dark:bg-neutral-900"

  const textClass =
    variant === "banner"
      ? "text-xs text-amber-800 dark:text-amber-200"
      : isStale
        ? "text-sm text-amber-900 dark:text-amber-100"
        : "text-sm text-neutral-700 dark:text-neutral-300"

  const subtextClass =
    variant === "banner"
      ? "mt-1 text-xs text-amber-700 dark:text-amber-300"
      : "mt-1 text-xs text-neutral-600 dark:text-neutral-400"

  const summary = lastSync
    ? t("snapshotUpdated", {
        timeAgo: formatOfflineSnapshotAge(lastSync, locale),
        date: formatOfflineSnapshotTimestamp(lastSync, locale),
      })
    : t("snapshotUnavailable")

  return (
    <div className={cn(containerClass, className)} role="status" aria-live="polite">
      <div className="flex items-start gap-2">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            variant === "banner" ? "text-amber-700 dark:text-amber-300" : undefined
          )}
        />
        <div>
          <p className={textClass}>{summary}</p>
          {isStale && <p className={subtextClass}>{t("snapshotStaleWarning")}</p>}
        </div>
      </div>
    </div>
  )
}
