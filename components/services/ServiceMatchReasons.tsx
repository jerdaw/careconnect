"use client"

import { useId, useState } from "react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { splitMatchReasons } from "@/lib/search/match-reasons"

interface ServiceMatchReasonsProps {
  reasons?: string[]
  previewCount?: number
}

export default function ServiceMatchReasons({ reasons, previewCount = 2 }: ServiceMatchReasonsProps) {
  const t = useTranslations("Search")
  const [expanded, setExpanded] = useState(false)
  const headingId = useId()
  const hiddenReasonsId = useId()
  const { all, preview, hidden } = splitMatchReasons(reasons, previewCount)

  if (all.length === 0) {
    return null
  }

  return (
    <div className="mt-2 space-y-1.5">
      <p
        id={headingId}
        className="text-[11px] font-medium tracking-[0.08em] text-neutral-500 uppercase dark:text-neutral-400"
      >
        {t("matchReasonsHeading")}
      </p>

      <ul aria-labelledby={headingId} className="flex flex-wrap gap-1">
        {preview.map((reason) => (
          <li key={reason}>
            <Badge
              variant="outline"
              size="sm"
              className="max-w-full border-neutral-200 bg-neutral-50 text-[11px] font-medium whitespace-normal text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-300"
            >
              {reason}
            </Badge>
          </li>
        ))}
      </ul>

      {hidden.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            className="text-primary-700 focus-visible:ring-primary-500/60 dark:text-primary-300 text-xs font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            aria-expanded={expanded}
            aria-controls={hiddenReasonsId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t("hideMatchReasons") : t("matchReasonsToggle")}
          </button>

          {expanded && (
            <ul
              id={hiddenReasonsId}
              aria-label={t("matchReasonsListLabel")}
              className="ml-4 list-disc space-y-1 text-xs text-neutral-600 dark:text-neutral-300"
            >
              {hidden.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
