"use client"

import { useState, useEffect, useRef } from "react"
import { useSemanticSearch } from "../../hooks/useSemanticSearch"
import { useSearch } from "../../hooks/useSearch"
import { useServices } from "../../hooks/useServices"
import { useTranslations } from "next-intl"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { parsePwaLaunchParams } from "@/lib/pwa/launch-params"
import { consumeShareTargetQueryFromDocument } from "@/lib/share-target"

// Modular Components
import ModelStatus from "../../components/home/ModelStatus"
import SearchBar from "../../components/home/SearchBar"
import SearchControls from "../../components/home/SearchControls"
import SearchChips from "../../components/home/SearchChips"
import SearchResultsList from "../../components/home/SearchResultsList"
import SafetyAlert from "../../components/home/SafetyAlert"
import HomeStats from "../../components/home/HomeStats"
import HowItWorks from "../../components/home/HowItWorks"
import CategoryBrowseGrid from "../../components/home/CategoryBrowseGrid"

export default function Home() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const lastHydratedParams = useRef<string | null>(null)
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

  // PWA launch hydration:
  // - `/` shortcut URLs (e.g. `/?category=Crisis`) are locale-resolved by middleware then land here.
  // - Share Target redirects to `/` and hands the shared query off via a short-lived first-party cookie.
  // This only applies when the URL params change, to avoid fighting user typing.
  useEffect(() => {
    const currentParamsKey = searchParams.toString()
    if (lastHydratedParams.current === currentParamsKey) return
    lastHydratedParams.current = currentParamsKey

    const { query: launchQuery, category: launchCategory, openNow: launchOpenNow } = parsePwaLaunchParams(searchParams)
    const cookieQuery = launchQuery === null ? consumeShareTargetQueryFromDocument() : null

    if (launchQuery !== null) setQuery(launchQuery)
    if (cookieQuery !== null) setQuery(cookieQuery)
    if (launchCategory !== null) setCategory(launchCategory)
    if (launchOpenNow !== null) setOpenNow(launchOpenNow)
  }, [searchParams, setQuery, setCategory, setOpenNow])

  // Progressive Search Hook
  const { isReady, initSemanticSearch, generateEmbedding } = useSemanticSearch()

  useEffect(() => {
    if (query.trim().length === 0) {
      return
    }

    void initSemanticSearch()
  }, [initSemanticSearch, query])

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

  // Ref for the search bar to scroll to
  const searchBarRef = useRef<HTMLDivElement>(null)

  // Scroll to search bar when search is performed
  useEffect(() => {
    if (hasSearched && searchBarRef.current) {
      // Scroll so search bar is visible just below the nav
      searchBarRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [hasSearched])

  const isActive = isFocused || query.length > 0
  const hasActiveSearch =
    hasSearched || isLoading || query.trim().length > 0 || Boolean(category) || openNow || Boolean(userLocation)

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div className="bg-noise" />
      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="relative pt-32 pb-4 transition-all duration-500 md:pt-48 md:pb-5">
          {/* Mesh Gradient Background */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="bg-primary-400/40 animate-float absolute top-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full mix-blend-multiply blur-[150px] dark:bg-indigo-600/30 dark:mix-blend-screen" />
            <div className="bg-accent-400/40 animate-float-delayed absolute top-[10%] left-[-10%] h-[50%] w-[50%] rounded-full mix-blend-multiply blur-[150px] dark:bg-cyan-600/20 dark:mix-blend-screen" />
            <div className="animate-pulse-glow absolute right-[20%] bottom-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-300/40 mix-blend-multiply blur-[150px] dark:bg-blue-700/20 dark:mix-blend-screen" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              key="hero-content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              <h1 className="heading-1 heading-display relative text-neutral-900 dark:text-white">
                <span className="relative z-10">Kingston</span>
                <span className="from-primary-600 via-primary-500 to-accent-500 relative z-10 bg-gradient-to-r bg-clip-text text-transparent">
                  {" "}
                  CareConnect
                </span>
                <div className="absolute -inset-x-8 -inset-y-4 -z-10 rounded-[50%] bg-white/30 blur-3xl dark:bg-white/5" />
              </h1>

              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-neutral-600 md:text-xl dark:text-neutral-300">
                {t("Home.hero.subtitle")}
              </p>

              <ModelStatus isReady={isReady} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-12 w-full max-w-3xl scroll-mt-24 md:max-w-4xl"
              ref={searchBarRef}
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
                    "relative h-full w-full rounded-[2rem] border-0 p-2 transition-all duration-300",
                    isActive
                      ? "bg-white/95 shadow-none ring-0 backdrop-blur-xl outline-none dark:bg-slate-900/95"
                      : "bg-white/80 shadow-none backdrop-blur-xl dark:bg-slate-900/80"
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

              {/* Suggestions & Chips */}
              {!hasSearched && query.length === 0 && (
                <div className="mt-6">
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

        {/* Discovery Layer — hidden when results are shown */}
        <div
          className={cn(
            "transition-all duration-500",
            hasActiveSearch ? "pointer-events-none mt-0 h-0 overflow-hidden opacity-0" : "mt-4 opacity-100"
          )}
          aria-hidden={hasActiveSearch || undefined}
        >
          <HomeStats />
          <CategoryBrowseGrid onCategorySelect={handleCategorySelect} />
          <HowItWorks />
        </div>

        {/* Results Section */}
        <Section className={hasActiveSearch ? "pt-0" : "h-0 overflow-hidden py-0 opacity-0"}>
          {hasActiveSearch && (
            <div className="mt-1 mb-5 md:mt-0 md:mb-6">
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
          )}

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
      </main>
      <Footer />
    </div>
  )
}
