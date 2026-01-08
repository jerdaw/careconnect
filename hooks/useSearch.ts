import { useState, useCallback } from "react"
import { SearchResult } from "@/lib/search"
import { useLocalStorage } from "./useLocalStorage"
import { useGeolocation } from "./useGeolocation"
import { logger } from "@/lib/logger"
import { useUserContext } from "./useUserContext"

/**
 * Primary search state management hook.
 * Handles query state, category filtering, geolocation, and saved searches.
 *
 * @example
 * const { query, setQuery, results, isLoading } = useSearch();
 *
 * @param initialQuery - Optional starting query string.
 * @returns An object containing search states and handlers.
 */
export function useSearch(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [openNow, setOpenNow] = useState(false)
  const [scope, setScope] = useState<'all' | 'kingston' | 'provincial'>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  // Use the new utility hooks
  const [savedSearches, setSavedSearches] = useLocalStorage<string[]>("kcc_saved_searches", [])
  const { coordinates: userLocation, isLocating, error: geoError, requestLocation, clearLocation } = useGeolocation()

  // Import User Context for personalization
  const { context: userContext } = useUserContext()

  const handleSaveSearch = useCallback(() => {
    if (!query) return
    setSavedSearches((prev) => {
      const newSaved = Array.from(new Set([query, ...prev])).slice(0, 5)
      return newSaved
    })
  }, [query, setSavedSearches])

  const removeSavedSearch = useCallback(
    (term: string) => {
      setSavedSearches((prev) => prev.filter((s) => s !== term))
    },
    [setSavedSearches]
  )

  const toggleLocation = useCallback(() => {
    if (userLocation) {
      clearLocation()
    } else {
      requestLocation()
    }
  }, [userLocation, clearLocation, requestLocation])

  // Handle geo errors by logging and alerting (MVP style)
  if (geoError && isLocating === false && hasSearched === false) {
    logger.error("Geolocation error in useSearch", new Error(geoError), { component: "useSearch" })
    // We could use a toast here, but keeping alert for compatibility with previous version
    // unless specified otherwise.
  }

  return {
    query,
    setQuery,
    category,
    setCategory,
    openNow,
    setOpenNow,
    scope,
    setScope,
    userLocation: userLocation || undefined,
    toggleLocation,
    isLocating,
    results,
    setResults,
    hasSearched,
    setHasSearched,
    isLoading,
    setIsLoading,
    suggestion,
    setSuggestion,
    savedSearches,
    handleSaveSearch,
    removeSavedSearch,
    userContext,
  }
}
