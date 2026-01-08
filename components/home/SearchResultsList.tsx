"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import ServiceCard from "../ServiceCard"
import ServiceCardSkeleton from "../ServiceCardSkeleton"
import { SearchResult } from "@/lib/search"
import { PrintButton } from "@/components/ui/PrintButton"
import ScopeFilterBar, { ScopeFilter } from "./ScopeFilterBar"

interface SearchResultsListProps {
  isLoading: boolean
  results: SearchResult[]
  hasSearched: boolean
  query: string
  category?: string
  userLocation?: { lat: number; lng: number }
}

export default function SearchResultsList({
  isLoading,
  results,
  hasSearched,
  query,
  category,
  userLocation,
}: SearchResultsListProps) {
  const t = useTranslations("Search")
  const [activeScope, setActiveScope] = useState<ScopeFilter>('all')

  // Calculate scope counts
  const scopeCounts = useMemo(() => {
    const local = results.filter(r => r.service.scope === 'kingston' || !r.service.scope).length
    const provincial = results.filter(r => r.service.scope === 'ontario' || r.service.scope === 'canada').length
    return { all: results.length, local, provincial }
  }, [results])

  // Reset scope if the current scope yields no results but others do (PREVENT TRAP)
  // Actually, better to show the fallback UI than auto-switch, to be explicit.

  // Filter results by active scope
  const filteredResults = useMemo(() => {
    if (activeScope === 'all') return results
    if (activeScope === 'kingston') {
      return results.filter(r => r.service.scope === 'kingston' || !r.service.scope)
    }
    if (activeScope === 'provincial') {
      return results.filter(r => r.service.scope === 'ontario' || r.service.scope === 'canada')
    }
    return results
  }, [results, activeScope])

  // Handle scope change from badge click on ServiceCard
  const handleScopeFilter = (scope: 'provincial') => {
    setActiveScope(scope)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ServiceCardSkeleton />
        <ServiceCardSkeleton />
        <ServiceCardSkeleton />
      </div>
    )
  }

  // Case 1: No results AT ALL (Local or Provincial)
  if (hasSearched && results.length === 0) {
    return (
      <div className="rounded-lg bg-neutral-100 p-6 text-center dark:bg-neutral-900">
        <p className="text-neutral-600 dark:text-neutral-400">
          {category 
            ? t('noResultsInCategory', { query, category }) 
            : t('noResults', { query })}
        </p>
      </div>
    )
  }

  // Case 2: Results exist, but filtered out by scope (The Trap)
  if (hasSearched && filteredResults.length === 0) {
    return (
      <div className="rounded-lg bg-neutral-100 p-8 text-center dark:bg-neutral-900">
        <p className="mb-4 text-neutral-600 dark:text-neutral-400">
          {t('noLocalResults')}
        </p>
        <Button 
          variant="outline" 
          onClick={() => setActiveScope('all')}
        >
          {t('showAllResults', { count: results.length })}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Contextual Scope Filter Bar - only shows for mixed-scope results */}
      {hasSearched && (
        <ScopeFilterBar
          counts={scopeCounts}
          activeScope={activeScope}
          onScopeChange={setActiveScope}
        />
      )}

      {/* Results Counter */}
      {hasSearched && filteredResults.length > 0 && (userLocation || category) && (
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>
            {filteredResults.length} results {userLocation && "sorted by distance"}
          </span>
          <PrintButton className="no-print" />
        </div>
      )}

      {filteredResults.map((result) => (
        <ServiceCard
          key={result.service.id}
          service={result.service}
          score={result.score}
          matchReasons={result.matchReasons}
          highlightTokens={query ? query.toLowerCase().split(/\s+/).filter(Boolean) : []}
          onScopeFilter={handleScopeFilter}
        />
      ))}
    </div>
  )
}

