"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type ScopeFilter = 'all' | 'kingston' | 'provincial'

interface ScopeFilterBarProps {
  counts: { all: number; local: number; provincial: number }
  activeScope: ScopeFilter
  onScopeChange: (scope: ScopeFilter) => void
  totalCount: number
}

/**
 * Contextual filter bar that shows scope options when results span multiple scopes,
 * or a simple "XX Results" text when results are homogeneous.
 */
export default function ScopeFilterBar({
  counts,
  activeScope,
  onScopeChange,
  totalCount,
}: ScopeFilterBarProps) {
  const t = useTranslations("Search")

  // If results are homogeneous (all local or all provincial), show simple count
  const isHomogeneous = counts.local === 0 || counts.provincial === 0

  if (isHomogeneous) {
    return (
      <span className="flex h-8 items-center text-sm text-neutral-500 dark:text-neutral-400">
        <span className="font-medium text-neutral-700 dark:text-neutral-200">{totalCount}</span>
        <span className="ml-1">{totalCount === 1 ? 'Result' : 'Results'}</span>
      </span>
    )
  }

  // Mixed results - show scope selector with "All XX" as first option
  const scopes: { id: ScopeFilter; label: string; count: number }[] = [
    { id: 'all', label: t('scope.all'), count: counts.all },
    { id: 'kingston', label: t('scope.local'), count: counts.local },
    { id: 'provincial', label: t('scope.provincial'), count: counts.provincial },
  ]

  return (
    <div className="flex h-8 items-center gap-0.5 rounded-lg border border-neutral-200 px-1 dark:border-neutral-700">
      {scopes.map((scope) => {
        const isActive = activeScope === scope.id
        return (
          <button
            key={scope.id}
            onClick={() => onScopeChange(scope.id)}
            className={cn(
              "relative flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-all outline-none",
              isActive
                ? "text-primary-600 dark:text-primary-400"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeScope"
                className="absolute inset-0 rounded-md bg-neutral-100 dark:bg-neutral-800"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{scope.label}</span>
            <span className="relative z-10 text-xs opacity-60">{scope.count}</span>
          </button>
        )
      })}
    </div>
  )
}
