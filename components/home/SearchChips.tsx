"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface SearchChipsProps {
  savedSearches: string[]
  removeSavedSearch: (term: string) => void
  startSearch: (term: string) => void
}

const QUICK_SEARCH_KEYS = ["foodBank", "housing", "crisis", "mentalHealth", "legalAid"] as const

export default function SearchChips({ savedSearches, removeSavedSearch, startSearch }: SearchChipsProps) {
  const t = useTranslations("Home.searchChips")
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Saved Searches */}
      {savedSearches.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2">
          <div className="w-full text-center">
            <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-bold tracking-wider text-neutral-950 uppercase ring-1 ring-neutral-200 dark:bg-white dark:text-neutral-950 dark:ring-neutral-200">
              {t("savedLabel")}
            </span>
          </div>
          {savedSearches.map((s) => (
            <div
              key={s}
              className="group flex items-center gap-1 rounded-full bg-blue-50 py-1 pr-1 pl-3 text-xs font-medium text-blue-900 ring-1 ring-blue-300 dark:bg-blue-50 dark:text-blue-900 dark:ring-blue-300"
            >
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-blue-900 dark:text-blue-900"
                onClick={() => startSearch(s)}
              >
                {s}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-blue-800 hover:text-blue-950 dark:text-blue-800 dark:hover:text-blue-950"
                onClick={(e) => {
                  e.stopPropagation()
                  removeSavedSearch(s)
                }}
                aria-label={t("removeSavedSearch", { term: s })}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
          <div className="px-1">
            <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-bold tracking-wider text-neutral-950 uppercase ring-1 ring-neutral-200 dark:bg-white dark:text-neutral-950 dark:ring-neutral-200">
              {t("quickSearchesLabel")}
            </span>
          </div>
          {QUICK_SEARCH_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => startSearch(t(`quickSearch.${key}`))}
              className="focus-visible:ring-primary-500 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-950 transition-colors hover:bg-neutral-50 hover:text-neutral-950 focus-visible:ring-2 focus-visible:outline-none dark:border-neutral-300 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
            >
              {t(`quickSearch.${key}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
