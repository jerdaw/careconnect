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
      className="fixed bottom-4 left-4 z-[40] max-w-[320px] animate-in fade-in slide-in-from-bottom-4 duration-500"
      role="status"
    >
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/50 bg-white/80 p-4 shadow-xl backdrop-blur-md dark:border-neutral-800/50 dark:bg-neutral-900/80">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {t("title")}
            </p>
            <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {t("message")}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="group -mr-1 -mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            aria-label={t("dismiss")}
          >
            <X className="h-3.5 w-3.5 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}
