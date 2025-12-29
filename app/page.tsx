'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchServices, SearchResult } from '../lib/search';
import ServiceCard from '../components/ServiceCard';
import { logSearchEvent } from '../lib/analytics';
import { useSemanticSearch } from '../hooks/useSemanticSearch';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Progressive Search Hook
  const { isReady, progress, generateEmbedding } = useSemanticSearch();

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      // 1. Instant Keyword Search (First Pass)
      const initialResults = await searchServices(query);
      setResults(initialResults);
      setHasSearched(true);

      // 2. Progressive Upgrade (If Model Ready)
      if (isReady) {
        const embedding = await generateEmbedding(query);
        if (embedding) {
          const enhancedResults = await searchServices(query, embedding);
          setResults(enhancedResults);
        }
      }

      // Analytics (Privacy-Preserving)
      logSearchEvent(query, initialResults.map(r => r.service));
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isReady, generateEmbedding]);

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
          The fastest way to find verified food, crisis, and housing support in Kingston.
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

        <div className="mt-8 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-neutral-900 dark:ring-neutral-800 dark:text-white sm:text-lg sm:leading-6"
            placeholder="Describe what you need (e.g., 'hungry', 'homeless', 'anxious')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Suggestion Chips */}
        {!hasSearched && query.length === 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={() => startSearch("I need food")} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800">
              🍞 I need food
            </button>
            <button onClick={() => startSearch("I need to talk to someone")} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800">
              🗣️ Crisis Support
            </button>
            <button onClick={() => startSearch("Where can I sleep")} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800">
              🏠 Housing Help
            </button>
            <button onClick={() => startSearch("See a doctor")} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800">
              🩺 Medical Care
            </button>
          </div>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-4">
        {hasSearched && results.length === 0 && (
          <div className="rounded-lg bg-neutral-100 p-6 text-center dark:bg-neutral-900">
            <p className="text-neutral-600 dark:text-neutral-400">
              No results found for &quot;{query}&quot;. Try &quot;food&quot;, &quot;shelter&quot;, or &quot;crisis&quot;.
            </p>
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
              Trusted by <strong>Queen&apos;s University</strong> students.
            </p>
            <div className="mt-4 flex justify-center gap-4 text-xs text-neutral-400">
              <span>Privacy First: No logging.</span>
              <a href="https://forms.gle/placeholder" target="_blank" className="hover:text-neutral-600 underline">Report a Problem</a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
