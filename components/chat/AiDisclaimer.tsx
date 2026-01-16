"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"

export function AiDisclaimer() {
  const t = useTranslations("AiDisclaimer")

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <h4 className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4" />
        {t("title")}
      </h4>

      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-amber-700 dark:text-amber-300">
        <li>{t("limitation1")}</li>
        <li>{t("limitation2")}</li>
      </ul>

      <div className="mt-3 rounded border border-red-200 bg-red-100 p-2 dark:border-red-800 dark:bg-red-900/50">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">{t("emergency")}</p>
      </div>

      <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{t("privacy")}</p>
    </div>
  )
}
