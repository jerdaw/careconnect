import { useEffect, useRef } from "react"
import { useLocale } from "next-intl"
import type { SearchResult } from "@/lib/search"
import { logger } from "@/lib/logger"
import { type SupportedLocale } from "@/lib/schemas/search"

interface UseServicesProps {
  query: string
  category?: string
  scope?: "all" | "kingston" | "provincial"
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
  scope = "all",
  userLocation,
  openNow,
  isReady,
  generateEmbedding,
  setResults,
  setIsLoading,
  setHasSearched,
  setSuggestion,
}: UseServicesProps) {
  const locale = useLocale()
  const lastAnalyticsSignature = useRef<string | null>(null)

  useEffect(() => {
    const performSearch = async () => {
      // Allow empty query if filters are active
      if (query.trim().length === 0 && !category && !userLocation && !openNow) {
        setResults([])
        setHasSearched(false)
        setSuggestion(null)
        return
      }

      // Reset search state immediately when starting a new search
      // This prevents showing stale "no results" from a previous search
      setIsLoading(true)
      setHasSearched(false)

      try {
        const [
          { searchServices },
          { isOffline },
          { setCachedServices },
          { getSearchMode, serverSearch },
          { enhanceSearchResults, filterSearchResultsByScope },
        ] = await Promise.all([
          import("@/lib/search"),
          import("@/lib/offline/status"),
          import("@/lib/offline/cache"),
          import("@/lib/search/search-mode"),
          import("@/lib/search/client-enhancer"),
        ])

        const mode = getSearchMode()
        const currentlyOffline = isOffline()

        let initialResults: SearchResult[] = []

        if (mode === "server" && !currentlyOffline) {
          // Server-Side Search (only if online)
          const serverServices = await serverSearch({
            query,
            locale: locale as SupportedLocale,
            filters: { category, openNow },
            options: { limit: 50, offset: 0 },
            location: userLocation,
          })

          // Map to SearchResult structure
          initialResults = serverServices.map((service, index) => ({
            service,
            score: 100 - index,
            matchReasons: ["Server Match"],
          }))
        } else {
          // Local Search (Always used if mode is local OR if we are offline)
          initialResults = await searchServices(query, {
            category,
            location: userLocation,
            openNow,
            onSuggestion: setSuggestion,
          })
        }

        // Apply scope filter
        const scopedResults = filterSearchResultsByScope(initialResults, scope)

        setResults(scopedResults)
        setHasSearched(true)
        setIsLoading(false)

        // Cache successful results
        if (scopedResults.length > 0) {
          setCachedServices(scopedResults)
        }

        const enhancedResults = await enhanceSearchResults({
          query,
          category,
          userLocation,
          openNow,
          isReady,
          mode,
          scope,
          generateEmbedding,
          search: searchServices,
        })

        if (enhancedResults) {
          setResults(enhancedResults)
        }

        // Analytics
        const analyticsSignature = JSON.stringify({
          query: query.trim(),
          category: category ?? null,
          hasLocation: !!userLocation,
          openNow: !!openNow,
          resultCount: scopedResults.length,
          locale,
        })

        if (lastAnalyticsSignature.current !== analyticsSignature) {
          lastAnalyticsSignature.current = analyticsSignature

          fetch("/api/v1/analytics/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              locale,
              resultCount: scopedResults.length,
            }),
          }).catch((err) =>
            logger.error("Analytics tracking failed", err, { component: "useServices", action: "analytics" })
          )
        }
      } catch (err) {
        logger.error("Search failed", err, { component: "useServices", action: "performSearch" })
        setIsLoading(false)
        setHasSearched(true)

        // Offline fallback
        const { getCachedServices } = await import("@/lib/offline/cache")
        const cached = getCachedServices<SearchResult[]>()
        if (cached) {
          setResults(cached)
        }
      }
    }

    const timer = setTimeout(performSearch, 150)
    return () => clearTimeout(timer)
  }, [
    query,
    category,
    scope,
    userLocation,
    openNow,
    isReady,
    generateEmbedding,
    setResults,
    setIsLoading,
    setHasSearched,
    setSuggestion,
    locale,
  ])
}
