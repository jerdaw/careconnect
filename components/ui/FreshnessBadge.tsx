"use client"

import { Badge } from "@/components/ui/badge"
import { useTranslations, useLocale } from "next-intl"
import { Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip } from "@/components/Tooltip/Tooltip"
import { FreshnessLevel, getFreshnessLevel } from "@/lib/freshness"

interface FreshnessBadgeProps {
  lastVerified?: string
  className?: string
}

function formatRelativeDate(dateString: string, locale: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  if (daysDiff === 0) return rtf.format(0, "day")
  if (daysDiff === 1) return rtf.format(-1, "day")
  if (daysDiff < 7) return rtf.format(-daysDiff, "day")
  if (daysDiff < 30) return rtf.format(-Math.floor(daysDiff / 7), "week")
  if (daysDiff < 365) return rtf.format(-Math.floor(daysDiff / 30), "month")
  return rtf.format(-Math.floor(daysDiff / 365), "year")
}

const freshnessConfig: Record<FreshnessLevel, { icon: typeof Clock; colorClass: string; levelKey: string }> = {
  fresh: {
    icon: CheckCircle,
    colorClass:
      "border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300",
    levelKey: "levels.fresh",
  },
  recent: {
    icon: Clock,
    colorClass: "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    levelKey: "levels.recent",
  },
  stale: {
    icon: AlertTriangle,
    colorClass:
      "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    levelKey: "levels.stale",
  },
  expired: {
    icon: AlertTriangle,
    colorClass: "border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-900/30 dark:text-red-200",
    levelKey: "levels.expired",
  },
  unknown: {
    icon: XCircle,
    colorClass:
      "border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
    levelKey: "unknown",
  },
}

export function FreshnessBadge({ lastVerified, className }: FreshnessBadgeProps) {
  const t = useTranslations("Freshness")
  const locale = useLocale()
  const level = getFreshnessLevel(lastVerified)
  const config = freshnessConfig[level]
  const Icon = config.icon

  const labelText = lastVerified ? formatRelativeDate(lastVerified, locale) : t("unknown")
  const dateText = lastVerified ? new Date(lastVerified).toLocaleDateString(locale, { dateStyle: "long" }) : ""

  const tooltipText = lastVerified
    ? level === "expired"
      ? t("expiredTooltip")
      : level === "stale"
        ? t("outdatedTooltip")
        : t("verifiedTooltip", { date: dateText })
    : t("neverVerified")

  return (
    <Tooltip explainer={tooltipText} side="top" withArrow>
      <Badge variant="outline" size="sm" className={cn("cursor-help gap-1 px-1.5 py-0", config.colorClass, className)}>
        <Icon className="h-3 w-3" />
        <span className="text-xs">
          {t("verified")} {labelText}
        </span>
      </Badge>
    </Tooltip>
  )
}
