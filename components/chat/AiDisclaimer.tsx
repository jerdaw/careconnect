"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"

export function AiDisclaimer() {
  const t = useTranslations("AiDisclaimer")

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950 mb-4">
      <h4 className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        {t("title")}
      </h4>
      
      <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300 list-disc pl-4">
        <li>{t("limitation1")}</li>
        <li>{t("limitation2")}</li>
      </ul>
      
      <div className="mt-3 rounded bg-red-100 p-2 dark:bg-red-900/50 border border-red-200 dark:border-red-800">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          {t("emergency")}
        </p>
      </div>
      
      <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
        {t("privacy")}
      </p>
    </div>
  )
}
