"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import { X, Sparkles } from "lucide-react"

const EDIA_LOCALES = ["ar", "zh-Hans", "es"]
const STORAGE_KEY = "kcc-translation-banner-dismissed"

export function TranslationBanner() {
  const locale = useLocale()
  const t = useTranslations("TranslationBanner")
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    setIsDismissed(dismissed === "true")
  }, [])

  if (!EDIA_LOCALES.includes(locale) || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setIsDismissed(true)
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-[40] max-w-[320px] animate-in fade-in slide-in-from-bottom-4 duration-500"
      role="alert"
    >
      <div className="relative overflow-hidden rounded-xl border border-amber-200/50 bg-amber-50/80 p-4 shadow-xl backdrop-blur-md dark:border-amber-900/50 dark:bg-amber-950/80">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-amber-400/20 blur-xl dark:bg-amber-500/10" />
        
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              {t("title")}
            </p>
            <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/90">
              {t("message")}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="group -mr-1 -mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-amber-200/50 dark:hover:bg-amber-800/50"
            aria-label={t("dismiss")}
          >
            <X className="h-3.5 w-3.5 text-amber-600/70 transition-colors group-hover:text-amber-700 dark:text-amber-400/70 dark:group-hover:text-amber-300" />
          </button>
        </div>
      </div>
    </div>
  )
}
