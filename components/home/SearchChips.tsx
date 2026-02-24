"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer } from "@/lib/motion"

interface SearchChipsProps {
  savedSearches: string[]
  removeSavedSearch: (term: string) => void
  startSearch: (term: string) => void
}

const QUICK_SEARCH_KEYS = ["foodBank", "housing", "crisis", "mentalHealth", "legalAid"] as const

export default function SearchChips({ savedSearches, removeSavedSearch, startSearch }: SearchChipsProps) {
  const t = useTranslations("Home.searchChips")
  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      {/* Saved Searches */}
      {savedSearches.length > 0 ? (
        <motion.div
          className="flex flex-wrap justify-center gap-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <div className="w-full text-center text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            {t("savedLabel")}
          </div>
          {savedSearches.map((s) => (
            <motion.div
              key={s}
              variants={fadeInUp}
              className="group flex items-center gap-1 rounded-full bg-blue-50 py-1 pr-1 pl-3 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800"
            >
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-blue-700 dark:text-blue-300"
                onClick={() => startSearch(s)}
              >
                {s}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-blue-400 hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation()
                  removeSavedSearch(s)
                }}
                aria-label={t("removeSavedSearch", { term: s })}
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-wrap justify-center gap-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <div className="w-full text-center text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            {t("quickSearchesLabel")}
          </div>
          {QUICK_SEARCH_KEYS.map((key) => (
            <motion.button
              key={key}
              variants={fadeInUp}
              onClick={() => startSearch(t(`quickSearch.${key}`))}
              className="hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:border-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-300 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {t(`quickSearch.${key}`)}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  )
}
