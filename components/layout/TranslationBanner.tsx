"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

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
      // Positioned above the chat assistant (approx bottom-24, right-4)
      className="fixed bottom-24 right-4 z-[40] max-w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-500"
      role="status"
    >
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/50 bg-white/90 p-3.5 shadow-xl backdrop-blur-md dark:border-neutral-800/50 dark:bg-neutral-900/90">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {t("title")}
              </p>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t("message")}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
             <button
              onClick={handleDismiss}
              className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
