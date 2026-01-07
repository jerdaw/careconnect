import { useEffect } from "react"
import { searchServices, SearchResult } from "@/lib/search"
import { getCachedServices, setCachedServices } from "@/lib/offline/cache"
import { logger } from "@/lib/logger"
import { getSearchMode, serverSearch } from "@/lib/search/search-mode"

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

      setIsLoading(true)

      try {
        const mode = getSearchMode()
        let initialResults: SearchResult[] = []

        if (mode === "server") {
          // Server-Side Search
          const serverServices = await serverSearch({
            query,
            locale: "en", // TODO: Get from context/hook
            filters: { category },
            options: { limit: 50, offset: 0 }
          })
          
          // Map to SearchResult structure
          // Server returns ranked list, so we assign a descending score
          initialResults = serverServices.map((service, index) => ({
            service,
            score: 100 - index, // Simple ranking preservation
            matchReasons: ["Server Match"]
          }))

        } else {
          // Local Search (Legacy)
          initialResults = await searchServices(query, {
            category,
            location: userLocation,
            openNow,
            onSuggestion: setSuggestion,
          })
        }

        setResults(initialResults)
        setHasSearched(true)
        setIsLoading(false)

        // Cache successful results
        if (initialResults.length > 0) {
          setCachedServices(initialResults)
        }

        // 2. Client-Side Enhancement (Personalization & Distance)
        // We apply this for BOTH modes to ensure consistent UX
        // (Server returns raw results; Client re-ranks for distance/identity)
        // TODO: Move this to a shared "enhancer" function in Phase 5
        
        // 3. Progressive Upgrade (Local Vector only for now)
        if (mode === "local" && isReady && query.trim().length > 0) {
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
            mode
          }),
        }).catch((err) =>
          logger.error("Analytics tracking failed", err, { component: "useServices", action: "analytics" })
        )
      } catch (err) {
        logger.error("Search failed", err, { component: "useServices", action: "performSearch" })
        setIsLoading(false)
        setHasSearched(true)

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
