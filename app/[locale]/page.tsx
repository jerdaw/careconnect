'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, ShieldCheck, MapPin, Heart, X } from 'lucide-react';
import { searchServices, SearchResult } from '../../lib/search';
import ServiceCard from '../../components/ServiceCard';
import { useSemanticSearch } from '../../hooks/useSemanticSearch';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/routing';
import { IntentCategory } from '../../types/service';

const CATEGORIES = Object.values(IntentCategory);

export default function Home() {
  const t = useTranslations();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  // Progressive Search Hook
  const { isReady, progress, generateEmbedding } = useSemanticSearch();

  // Load saved searches
  useEffect(() => {
    const saved = localStorage.getItem('kcc_saved_searches');
    if (saved) {
      setSavedSearches(JSON.parse(saved) as string[]);
    }
  }, []);

  const handleSaveSearch = () => {
    if (!query) return;
    const newSaved = Array.from(new Set([query, ...savedSearches])).slice(0, 5);
    setSavedSearches(newSaved);
    localStorage.setItem('kcc_saved_searches', JSON.stringify(newSaved));
  };

  const removeSavedSearch = (term: string) => {
    const newSaved = savedSearches.filter(s => s !== term);
    setSavedSearches(newSaved);
    localStorage.setItem('kcc_saved_searches', JSON.stringify(newSaved));
  };

  const toggleLocation = () => {
    if (userLocation) {
      setUserLocation(undefined);
      return;
    }

    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Geo error:", error);
          setIsLocating(false);
          alert("Could not get your location. Please check browser permissions.");
        }
      );
    } else {
      setIsLocating(false);
      alert("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      // Allow empty query if filters are active
      if (query.trim().length === 0 && !category && !userLocation) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setHasSearched(true);

      // 1. Instant Keyword/Filter Search (First Pass)
      const initialResults = await searchServices(query, { category, location: userLocation });
      setResults(initialResults);

      // 2. Progressive Upgrade (If Model Ready & Query exists)
      if (isReady && query.trim().length > 0) {
        const embedding = await generateEmbedding(query);
        if (embedding) {
          const enhancedResults = await searchServices(query, {
            category,
            location: userLocation,
            vectorOverride: embedding
          });
          setResults(enhancedResults);
        }
      }

      // Analytics
      fetch('/api/v1/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          category,
          hasLocation: !!userLocation,
          resultCount: initialResults.length
        })
      }).catch(err => console.error(err));
    };

    const timer = setTimeout(performSearch, 150);
    return () => clearTimeout(timer);
  }, [query, category, userLocation, isReady, generateEmbedding]);

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
              <button
                onClick={handleSaveSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-red-500"
                title="Save this search"
              >
                <Heart className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Location Toggle */}
            <button
              onClick={toggleLocation}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${userLocation
                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800'
                }`}
            >
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {userLocation ? 'Near Me' : 'Use Location'}
            </button>

            {/* Category Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
              <button
                onClick={() => setCategory(undefined)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${!category
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === category ? undefined : cat)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}
                >
                  {cat}
                </button>
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
                  <div key={s} className="group flex items-center gap-1 rounded-full bg-blue-50 pl-3 pr-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">
                    <button onClick={() => setQuery(s)}>{s}</button>
                    <button onClick={(e) => { e.stopPropagation(); removeSavedSearch(s); }} className="text-blue-400 hover:text-blue-600"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Default Suggestions */}
            <div className="flex flex-wrap justify-center gap-2">
              <div className="w-full text-xs font-semibold uppercase text-neutral-400 tracking-wider">Popular</div>
              <button onClick={() => startSearch("I need food")} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800">
                🍞 I need food
              </button>
              <button onClick={() => startSearch("I need to talk to someone")} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800">
                🗣️ Crisis Support
              </button>
              <button onClick={() => startSearch("See a doctor")} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800">
                🩺 Medical Care
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-4">
        {hasSearched && results.length === 0 && (
          <div className="rounded-lg bg-neutral-100 p-6 text-center dark:bg-neutral-900">
            <p className="text-neutral-600 dark:text-neutral-400">
              No results found for &quot;{query}&quot; {category && `in ${category}`}.
            </p>
          </div>
        )}

        {/* Results Counter if filters active */}
        {hasSearched && results.length > 0 && (userLocation || category) && (
          <div className="text-xs text-neutral-400 text-right">
            {results.length} results {userLocation && 'sorted by distance'}
          </div>
        )}

        {results.map((result) => (
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
