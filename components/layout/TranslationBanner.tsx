"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

const EDIA_LOCALES = ["ar", "zh-Hans", "es", "pa", "pt"]
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
      {/* Adjust backdrop-blur-* to control glass effect intensity (sm, md, lg, xl) */}
      <div className="relative overflow-hidden rounded-xl border border-white/30 bg-white/85 p-3.5 shadow-md backdrop-blur-lg dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 dark:bg-indigo-500/20">
                <Sparkles className="h-4 w-4 text-indigo-700 dark:text-indigo-300" />
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
              className="rounded-lg border border-white/20 bg-white/40 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-white/60 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
