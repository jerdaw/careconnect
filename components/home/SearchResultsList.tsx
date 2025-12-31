import ServiceCard from "../ServiceCard"
import ServiceCardSkeleton from "../ServiceCardSkeleton"
import { SearchResult } from "@/lib/search"

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
  if (isLoading) {
    return (
      <div className="space-y-4">
        <ServiceCardSkeleton />
        <ServiceCardSkeleton />
        <ServiceCardSkeleton />
      </div>
    )
  }

  if (hasSearched && results.length === 0) {
    return (
      <div className="rounded-lg bg-neutral-100 p-6 text-center dark:bg-neutral-900">
        <p className="text-neutral-600 dark:text-neutral-400">
          No results found for &quot;{query}&quot; {category && `in ${category}`}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Results Counter if filters active */}
      {hasSearched && results.length > 0 && (userLocation || category) && (
        <div className="text-right text-xs text-neutral-400">
          {results.length} results {userLocation && "sorted by distance"}
        </div>
      )}

      {results.map((result) => (
        <ServiceCard
          key={result.service.id}
          service={result.service}
          score={result.score}
          matchReasons={result.matchReasons}
          highlightTokens={query ? query.toLowerCase().split(/\s+/).filter(Boolean) : []}
        />
      ))}
    </div>
  )
}
