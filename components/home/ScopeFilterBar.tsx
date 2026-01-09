"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export type ScopeFilter = 'all' | 'kingston' | 'provincial'

interface ScopeFilterBarProps {
  counts: { all: number; local: number; provincial: number }
  activeScope: ScopeFilter
  onScopeChange: (scope: ScopeFilter) => void
}

/**
 * Contextual filter bar that only appears when search results span multiple scopes.
 * Shows counts for All, Local (Kingston), and Provincial (Ontario/Canada) services.
 */
export default function ScopeFilterBar({
  counts,
  activeScope,
  onScopeChange,
}: ScopeFilterBarProps) {
  const t = useTranslations("Search")

  // Don't render if results are homogeneous (all local or all provincial)
  if (counts.local === 0 || counts.provincial === 0) {
    return null
  }

  const scopes: { id: ScopeFilter; label: string; count: number }[] = [
    { id: 'all', label: t('scope.all'), count: counts.all },
    { id: 'kingston', label: t('scope.local'), count: counts.local },
    { id: 'provincial', label: t('scope.provincial'), count: counts.provincial },
  ]

  return (
    <div className="flex items-center gap-1">
      {scopes.map((scope, index) => {
        const isActive = activeScope === scope.id
        return (
          <span key={scope.id} className="flex items-center">
            {index > 0 && <span className="mx-1 text-neutral-300 dark:text-neutral-600">•</span>}
            <button
              onClick={() => onScopeChange(scope.id)}
              className={cn(
                "transition-colors rounded px-1.5 py-0.5",
                isActive
                  ? "text-primary-600 dark:text-primary-400 font-medium"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              )}
            >
              {scope.label} <span className="text-xs opacity-70">{scope.count}</span>
            </button>
          </span>
        )
      })}
    </div>
  )
}
