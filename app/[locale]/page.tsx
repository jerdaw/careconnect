"use client"

import { useState } from "react"
import { useSemanticSearch } from "../../hooks/useSemanticSearch"
import { useSearch } from "../../hooks/useSearch"
import { useServices } from "../../hooks/useServices"
import { useTranslations } from "next-intl"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"


// Modular Components
import ModelStatus from "../../components/home/ModelStatus"
import SearchBar from "../../components/home/SearchBar"
import SearchControls from "../../components/home/SearchControls"
import SearchChips from "../../components/home/SearchChips"
import SearchResultsList from "../../components/home/SearchResultsList"
import SafetyAlert from "../../components/home/SafetyAlert"

export default function Home() {
  const t = useTranslations()
  const [isFocused, setIsFocused] = useState(false)
  const {
    query,
    setQuery,
    category,
    setCategory,
    openNow,
    setOpenNow,
    userLocation,
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
  } = useSearch()

  // Progressive Search Hook
  const { isReady, progress, generateEmbedding } = useSemanticSearch()

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
    setSuggestion,
  })

  const isActive = isFocused || query.length > 0

  return (
    <main id="main-content" className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="bg-noise" />
      <Header forceSolid={hasSearched} />

      {/* Hero Section */}
      <section className={cn(
        "relative transition-all duration-500 scroll-mt-20",
        hasSearched
          ? "pt-24 pb-4 md:pt-20 md:pb-6"
          : "pt-32 pb-20 md:pt-48 md:pb-32"
      )}>
        {/* Mesh Gradient Background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="bg-primary-400/40 animate-float dark:bg-primary-700/40 absolute top-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full mix-blend-multiply blur-[150px] dark:mix-blend-screen" />
          <div className="bg-accent-400/40 animate-float-delayed dark:bg-accent-700/40 absolute top-[10%] left-[-10%] h-[50%] w-[50%] rounded-full mix-blend-multiply blur-[150px] dark:mix-blend-screen" />
          <div className="animate-pulse-glow absolute right-[20%] bottom-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-300/40 mix-blend-multiply blur-[150px] dark:bg-indigo-700/40 dark:mix-blend-screen" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">

          <AnimatePresence mode="wait">
            {!hasSearched && (
              <motion.div
                key="hero-content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6"
              >
                <h1 className="heading-1 heading-display relative text-neutral-900 dark:text-white">
                  <span className="relative z-10">Kingston</span>
                  <span className="from-primary-600 via-primary-500 to-accent-500 relative z-10 bg-gradient-to-r bg-clip-text text-transparent">
                    {" "}
                    Care Connect
                  </span>
                  <div className="absolute -inset-x-8 -inset-y-4 -z-10 rounded-[50%] bg-white/30 blur-3xl dark:bg-white/5" />
                </h1>

                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-neutral-600 md:text-xl dark:text-neutral-300">
                  {t("Footer.disclaimer")}
                </p>

                <ModelStatus isReady={isReady} progress={progress} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12"
          >
            <div className="shadow-primary-900/5 relative transform overflow-hidden rounded-[2rem] p-[2px] shadow-2xl transition-all duration-500 hover:scale-[1.01]">
              {/* Moving Multicolor Border (Idle - spinning segment) */}
              <div
                className={cn(
                  "absolute inset-[-50%] animate-[spin_10s_linear_infinite] bg-[conic-gradient(from_0deg,var(--color-primary-500),var(--color-accent-500),var(--color-primary-500))]",
                  "transition-opacity duration-500 ease-in-out",
                  isActive ? "opacity-0" : "opacity-60 dark:opacity-40"
                )}
              />

              {/* Static Full Gradient Border (Active - pulsing to full) */}
              <div
                className={cn(
                  "from-primary-500 via-accent-500 to-primary-500 absolute inset-0 bg-gradient-to-r",
                  "transition-opacity duration-500 ease-in-out",
                  isActive ? "opacity-80" : "opacity-0"
                )}
              />

              <div
                className={cn(
                  "relative h-full w-full rounded-[2rem] p-2 transition-all duration-300 border-0",
                  isActive
                    ? "bg-white/95 backdrop-blur-xl shadow-none ring-0 outline-none dark:bg-slate-900/95"
                    : "bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 shadow-none"
                )}
              >
                <SearchBar
                  query={query}
                  setQuery={setQuery}
                  handleSaveSearch={handleSaveSearch}
                  placeholder={t("Search.placeholder")}
                  label={t("Search.label")}
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
      <Section className={hasSearched ? "pt-0" : "h-0 overflow-hidden py-0 opacity-0"}>
        {suggestion && !isLoading && (
          <div className="bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800/50 mb-8 rounded-xl border p-4 text-center">
            <p className="text-primary-700 dark:text-primary-300 text-sm">
              {t("Search.didYouMean")}{" "}
              <button
                onClick={() => setQuery(suggestion)}
                className="decoration-primary-400 hover:text-primary-600 dark:hover:text-primary-200 font-bold underline"
              >
                {suggestion}
              </button>
              ?
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
  )
}
