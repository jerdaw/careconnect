import { useEffect } from "react"
import { searchServices, SearchResult } from "@/lib/search"
import { getCachedServices, setCachedServices } from "@/lib/offline/cache"
import { logger } from "@/lib/logger"

interface UseServicesProps {
  query: string
  category?: string
  userLocation?: { lat: number; lng: number }
  openNow?: boolean
  isReady: boolean
  generateEmbedding: (text: string) => Promise<number[] | null>
  setResults: (results: SearchResult[]) => void
  setIsLoading: (loading: boolean) => void
  setHasSearched: (searched: boolean) => void
  setSuggestion: (suggestion: string | null) => void
}

export function useServices({
  query,
  category,
  userLocation,
  openNow,
  isReady,
  generateEmbedding,
  setResults,
  setIsLoading,
  setHasSearched,
  setSuggestion,
}: UseServicesProps) {
  useEffect(() => {
    const performSearch = async () => {
      // Allow empty query if filters are active
      if (query.trim().length === 0 && !category && !userLocation) {
        setResults([])
        setHasSearched(false)
        setSuggestion(null)
        return
      }

      setHasSearched(true)
      setIsLoading(true)

      try {
        // 1. Instant Keyword/Filter Search (First Pass)
        const initialResults = await searchServices(query, {
          category,
          location: userLocation,
          openNow,
          onSuggestion: setSuggestion,
        })
        setResults(initialResults)
        setIsLoading(false) // Show initial results immediately

        // Cache successful results
        if (initialResults.length > 0) {
          setCachedServices(initialResults)
        }

        // 2. Progressive Upgrade (If Model Ready & Query exists)
        if (isReady && query.trim().length > 0) {
          const embedding = await generateEmbedding(query)
          if (embedding) {
            const enhancedResults = await searchServices(query, {
              category,
              location: userLocation,
              vectorOverride: embedding,
              openNow,
            })
            setResults(enhancedResults)
          }
        }

        // Analytics
        fetch("/api/v1/analytics/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            category,
            hasLocation: !!userLocation,
            resultCount: initialResults.length,
          }),
        }).catch((err) =>
          logger.error("Analytics tracking failed", err, { component: "useServices", action: "analytics" })
        )
      } catch (err) {
        logger.error("Search failed", err, { component: "useServices", action: "performSearch" })
        setIsLoading(false)

        // Offline fallback
        const cached = getCachedServices<SearchResult[]>()
        if (cached) {
          setResults(cached)
        }
      }
    }

    const timer = setTimeout(performSearch, 150)
    return () => clearTimeout(timer)
  }, [query, category, userLocation, openNow, isReady, generateEmbedding, setResults, setIsLoading, setHasSearched, setSuggestion])
}
