'use client';

import { Search, Loader2, ShieldCheck, MapPin, Heart, X } from 'lucide-react';


// import { searchServices, SearchResult } from '../../lib/search';
import ServiceCard from '../../components/ServiceCard';
import ServiceCardSkeleton from '../../components/ServiceCardSkeleton';
import { useSemanticSearch } from '../../hooks/useSemanticSearch';
import { useSearch } from '../../hooks/useSearch';
import { useServices } from '../../hooks/useServices';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/routing';
import { IntentCategory } from '../../types/service';
import { Button } from '../../components/ui/button';

const CATEGORIES = Object.values(IntentCategory);

export default function Home() {
  const t = useTranslations();
  const {
    query, setQuery,
    category, setCategory,
    userLocation, toggleLocation, isLocating,
    results, setResults,
    hasSearched, setHasSearched,
    isLoading, setIsLoading,
    savedSearches, handleSaveSearch, removeSavedSearch
  } = useSearch();

  // Progressive Search Hook
  const { isReady, progress, generateEmbedding } = useSemanticSearch();

  // Perform Search Logic
  useServices({
    query,
    category,
    userLocation,
    isReady,
    generateEmbedding,
    setResults,
    setIsLoading,
    setHasSearched
  });

  // Suggested Chips
  const startSearch = (term: string) => {
    setQuery(term);
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-12 dark:bg-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
          Kingston Care Connect.
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          {t('Footer.disclaimer')}
        </p>

        {/* Model Status Indicator (Subtle) */}
        {!isReady && progress !== null && progress < 100 && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Enhancing search capability... {Math.round(progress)}%</span>
          </div>
        )}
        {isReady && (
          <div className="mt-2 text-xs text-green-600 dark:text-green-500 animate-in fade-in duration-1000">
            ⚡ Private Neural Search Active
          </div>
        )}

        {/* Search Bar Area */}
        <div className="mt-8 flex flex-col gap-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-2xl border-0 py-4 pl-12 pr-12 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-neutral-900 dark:ring-neutral-800 dark:text-white sm:text-lg sm:leading-6"
              placeholder={t('Search.placeholder')}
              aria-label={t('Search.label')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveSearch}
                className="absolute inset-y-0 right-4 my-auto h-8 w-8 text-neutral-400 hover:text-red-500"
                title="Save this search"
                aria-label="Save this search"
              >
                <Heart className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Location Toggle */}
            <Button
              variant={userLocation ? "default" : "pill"}
              size="pill"
              onClick={toggleLocation}
              aria-pressed={!!userLocation}
              aria-label={userLocation ? "Clear location filter" : "Filter by current location"}
              className={userLocation ? 'rounded-full' : ''}
            >
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {userLocation ? 'Near Me' : 'Use Location'}
            </Button>

            {/* Category Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full" role="group" aria-label="Filter by category">
              <Button
                variant={!category ? "default" : "secondary"}
                size="sm"
                onClick={() => setCategory(undefined)}
                aria-pressed={!category}
                className="rounded-full"
              >
                All
              </Button>
              {CATEGORIES.map(cat => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setCategory(cat === category ? undefined : cat)}
                  aria-pressed={category === cat}
                  className="rounded-full whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestion & Saved Search Chips */}
        {!hasSearched && query.length === 0 && (
          <div className="mt-6 flex flex-col items-center gap-4">
            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                <div className="w-full text-xs font-semibold uppercase text-neutral-400 tracking-wider">Saved</div>
                {savedSearches.map(s => (
                  <div key={s} className="group flex items-center gap-1 rounded-full bg-blue-50 pl-3 pr-1 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs text-blue-700 dark:text-blue-300"
                      onClick={() => setQuery(s)}
                    >
                      {s}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-blue-400 hover:text-blue-600"
                      onClick={(e) => { e.stopPropagation(); removeSavedSearch(s); }}
                      aria-label={`Remove saved search ${s}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Default Suggestions */}
            <div className="flex flex-wrap justify-center gap-2">
              <div className="w-full text-xs font-semibold uppercase text-neutral-400 tracking-wider">Popular</div>
              <Button variant="pill" onClick={() => startSearch("I need food")}>
                🍞 I need food
              </Button>
              <Button variant="pill" onClick={() => startSearch("I need to talk to someone")}>
                🗣️ Crisis Support
              </Button>
              <Button variant="pill" onClick={() => startSearch("See a doctor")}>
                🩺 Medical Care
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-4">
        {isLoading && (
          <>
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
          </>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="rounded-lg bg-neutral-100 p-6 text-center dark:bg-neutral-900">
            <p className="text-neutral-600 dark:text-neutral-400">
              No results found for &quot;{query}&quot; {category && `in ${category}`}.
            </p>
          </div>
        )}

        {/* Results Counter if filters active */}
        {!isLoading && hasSearched && results.length > 0 && (userLocation || category) && (
          <div className="text-xs text-neutral-400 text-right">
            {results.length} results {userLocation && 'sorted by distance'}
          </div>
        )}

        {!isLoading && results.map((result) => (
          <ServiceCard
            key={result.service.id}
            service={result.service}
            score={result.score}
            matchReasons={result.matchReasons}
          />
        ))}

        {!hasSearched && (
          <div className="mt-20 border-t border-neutral-200 pt-10 text-center dark:border-neutral-800">
            <p className="text-sm text-neutral-500">
              {t('Footer.disclaimer')}
            </p>
            <div className="mt-8 text-center text-sm text-neutral-400">
              <p>
                Kingston Care Connect (Pilot v1.0) •{' '}
                <a href="mailto:feedback@kingstoncare.ca?subject=Data%20Correction" className="underline hover:text-neutral-600">
                  Report Incorrect Data
                </a>
              </p>
              <p className="mt-2 flex items-center justify-center gap-2 text-xs">
                <Link href="/privacy" className="flex items-center gap-1 hover:text-neutral-600 hover:underline">
                  <ShieldCheck className="h-3 w-3" />
                  {t('Privacy.simplified')}
                </Link>
                <span>•</span>
                <span>no cookies, no tracking</span>
              </p>
              <p className="mt-2 text-xs">
                Not a substitute for professional medical advice. In an emergency, call 911 or 988.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
