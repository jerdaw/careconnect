"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import { X, Info } from "lucide-react"

const EDIA_LOCALES = ["ar", "zh-Hans", "es"]
const STORAGE_KEY = "kcc-translation-banner-dismissed"

export function TranslationBanner() {
  const locale = useLocale()
  const t = useTranslations("TranslationBanner")
  const [isDismissed, setIsDismissed] = useState(true) // Default to hidden to prevent flash

  useEffect(() => {
    // Check localStorage on mount
    const dismissed = localStorage.getItem(STORAGE_KEY)
    setIsDismissed(dismissed === "true")
  }, [])

  // Only show for EDIA locales
  if (!EDIA_LOCALES.includes(locale)) {
    return null
  }

  if (isDismissed) {
    return null
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setIsDismissed(true)
  }

  return (
    <div 
      className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/50 dark:border-amber-800"
      role="alert"
      aria-live="polite"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-amber-800 dark:text-amber-200">
                {t("title")}:
              </span>{" "}
              <span className="text-amber-700 dark:text-amber-300">
                {t("message")}
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-md p-1.5 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors"
            aria-label={t("dismiss")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
