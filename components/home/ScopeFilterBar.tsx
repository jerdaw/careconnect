"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Globe, MapPin } from "lucide-react"

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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap items-center justify-center gap-2 pb-2"
    >
      <Button
        variant={activeScope === 'all' ? "default" : "secondary"}
        size="sm"
        onClick={() => onScopeChange('all')}
        aria-pressed={activeScope === 'all'}
        className="rounded-full"
      >
        {t('scope.all')}
        <span className="ml-1 opacity-70">({counts.all})</span>
      </Button>

      <Button
        variant={activeScope === 'kingston' ? "default" : "secondary"}
        size="sm"
        onClick={() => onScopeChange('kingston')}
        aria-pressed={activeScope === 'kingston'}
        className="rounded-full"
      >
        <MapPin className="h-3.5 w-3.5" />
        {t('scope.local')}
        <span className="ml-1 opacity-70">({counts.local})</span>
      </Button>

      <Button
        variant={activeScope === 'provincial' ? "default" : "secondary"}
        size="sm"
        onClick={() => onScopeChange('provincial')}
        aria-pressed={activeScope === 'provincial'}
        className="rounded-full"
      >
        <Globe className="h-3.5 w-3.5" />
        {t('scope.provincial')}
        <span className="ml-1 opacity-70">({counts.provincial})</span>
      </Button>
    </motion.div>
  )
}
