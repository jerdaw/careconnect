"use client"

import { useState } from 'react';
import { useSemanticSearch } from '../../hooks/useSemanticSearch';
import { useSearch } from '../../hooks/useSearch';
import { useServices } from '../../hooks/useServices';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Section } from '@/components/ui/section';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Modular Components
import ModelStatus from '../../components/home/ModelStatus';
import SearchBar from '../../components/home/SearchBar';
import SearchControls from '../../components/home/SearchControls';
import SearchChips from '../../components/home/SearchChips';
import SearchResultsList from '../../components/home/SearchResultsList';
import SafetyAlert from '../../components/home/SafetyAlert';

export default function Home() {
  const t = useTranslations();
  const [isFocused, setIsFocused] = useState(false);
  const {
    query, setQuery,
    category, setCategory,
    openNow, setOpenNow,
    userLocation, toggleLocation, isLocating,
    results, setResults,
    hasSearched, setHasSearched,
    isLoading, setIsLoading,
    suggestion, setSuggestion,
    savedSearches, handleSaveSearch, removeSavedSearch
  } = useSearch();

  // Progressive Search Hook
  const { isReady, progress, generateEmbedding } = useSemanticSearch();

  // Perform Search Logic
  useServices({
    query,
    category,
    userLocation,
    openNow,
    isReady,
    generateEmbedding,
    setResults,
    setIsLoading,
    setHasSearched,
    setSuggestion
  });

  const isActive = isFocused || query.length > 0;

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="bg-noise" />
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
        {/* Mesh Gradient Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-400/40 rounded-full blur-[100px] mix-blend-multiply animate-float dark:bg-primary-900/30 dark:mix-blend-screen" />
          <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-accent-400/40 rounded-full blur-[100px] mix-blend-multiply animate-float-delayed dark:bg-accent-900/30 dark:mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[20%] w-[60%] h-[60%] bg-indigo-300/40 rounded-full blur-[100px] mix-blend-multiply animate-pulse-glow dark:bg-indigo-900/30 dark:mix-blend-screen" />
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-white/60 backdrop-blur-md shadow-sm text-xs font-semibold text-primary-700 dark:bg-white/5 dark:border-white/10 dark:text-primary-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Pilot v1.0 Live
            </div>

            <h1 className="heading-1 text-neutral-900 dark:text-white heading-display relative">
              <span className="relative z-10">Kingston</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 relative z-10"> Care Connect</span>
              <div className="absolute -inset-x-8 -inset-y-4 bg-white/30 dark:bg-white/5 blur-3xl -z-10 rounded-[50%]" />
            </h1>

            <p className="mx-auto max-w-2xl text-lg md:text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {t('Footer.disclaimer')}
            </p>

            <ModelStatus isReady={isReady} progress={progress} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12"
          >
            <div className="relative rounded-[2rem] p-[2px] overflow-hidden transform transition-all duration-500 hover:scale-[1.01] shadow-2xl shadow-primary-900/5">
              {/* Moving Multicolor Border (Inactive) */}
              <div
                className={cn(
                  "absolute inset-[-50%] bg-[conic-gradient(from_0deg,var(--color-primary-500),var(--color-accent-500),var(--color-primary-500))] animate-[spin_10s_linear_infinite]",
                  "transition-opacity duration-700 ease-in-out",
                  isActive ? "opacity-0" : "opacity-60 dark:opacity-40"
                )}
              />

              {/* Static Full Gradient (Active) */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500",
                  "transition-opacity duration-700 ease-in-out",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />

              <div className={cn(
                "relative p-2 rounded-[2rem] h-full w-full transition-all duration-300",
                isActive
                  ? "bg-white dark:bg-slate-900 shadow-none border-0 ring-0 outline-none"
                  : "glass-card bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/50 dark:border-white/5"
              )}>
                <SearchBar
                  query={query}
                  setQuery={setQuery}
                  handleSaveSearch={handleSaveSearch}
                  placeholder={t('Search.placeholder')}
                  label={t('Search.label')}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </div>
            </div>

            <div className="mt-6">
              <SearchControls
                userLocation={userLocation}
                toggleLocation={toggleLocation}
                isLocating={isLocating}
                category={category}
                setCategory={setCategory}
                openNow={openNow}
                setOpenNow={setOpenNow}
              />
            </div>

            {/* Suggestions & Chips */}
            {!hasSearched && query.length === 0 && (
              <div className="mt-8">
                <SearchChips
                  savedSearches={savedSearches}
                  removeSavedSearch={removeSavedSearch}
                  startSearch={(term) => setQuery(term)}
                />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <Section className={hasSearched || query.length > 0 ? "pt-0" : "opacity-0 h-0 overflow-hidden py-0"}>
        {suggestion && !isLoading && (
          <div className="mb-8 rounded-xl bg-primary-50/50 p-4 text-center dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              {t('Search.didYouMean')} <button
                onClick={() => setQuery(suggestion)}
                className="font-bold underline decoration-primary-400 hover:text-primary-600 dark:hover:text-primary-200"
              >
                {suggestion}
              </button>?
            </p>
          </div>
        )}

        <SafetyAlert query={query} category={category} />

        <SearchResultsList
          isLoading={isLoading}
          results={results}
          hasSearched={hasSearched}
          query={query}
          category={category}
          userLocation={userLocation}
        />
      </Section>

      <Footer />
    </main>
  );
}
