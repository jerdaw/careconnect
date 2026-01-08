"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
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
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start py-2"
    >
      <div className="inline-flex items-center rounded-full border bg-neutral-100/50 p-1 dark:bg-neutral-900/50">
        {scopes.map((scope) => {
          const isActive = activeScope === scope.id
          return (
            <button
              key={scope.id}
              onClick={() => onScopeChange(scope.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-primary-900 dark:text-primary-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeScope"
                  className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-neutral-800"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{scope.label}</span>
              <span className={cn(
                "relative z-10 rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                isActive
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              )}>
                {scope.count}
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
