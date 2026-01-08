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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center gap-1 py-3 text-sm text-muted-foreground"
    >
      <span className="mr-1">{t('filterBar.showing')}:</span>
      
      <button
        onClick={() => onScopeChange('all')}
        className={cn(
          "px-2 py-0.5 rounded-md transition-colors",
          activeScope === 'all' 
            ? "text-foreground font-medium underline underline-offset-4 decoration-2 decoration-primary"
            : "hover:text-foreground"
        )}
      >
        {t('scope.all')} ({counts.all})
      </button>
      
      <span className="text-muted-foreground/50">·</span>
      
      <button
        onClick={() => onScopeChange('kingston')}
        className={cn(
          "px-2 py-0.5 rounded-md transition-colors",
          activeScope === 'kingston'
            ? "text-foreground font-medium underline underline-offset-4 decoration-2 decoration-primary"
            : "hover:text-foreground"
        )}
      >
        {t('scope.local')} ({counts.local})
      </button>
      
      <span className="text-muted-foreground/50">·</span>
      
      <button
        onClick={() => onScopeChange('provincial')}
        className={cn(
          "px-2 py-0.5 rounded-md transition-colors",
          activeScope === 'provincial'
            ? "text-foreground font-medium underline underline-offset-4 decoration-2 decoration-primary"
            : "hover:text-foreground"
        )}
      >
        {t('scope.provincial')} ({counts.provincial})
      </button>
    </motion.div>
  )
}
