"use client"

import { AlertTriangle, Phone } from "lucide-react"
import { useTranslations } from "next-intl"

interface EmergencyDisclaimerProps {
  variant?: "banner" | "inline" | "compact"
  showCrisisLines?: boolean
}

export function EmergencyDisclaimer({ 
  variant = "banner",
  showCrisisLines = true 
}: EmergencyDisclaimerProps) {
  const t = useTranslations("Emergency")
  
  const crisisLines = [
    { name: "Emergency Services", number: "911", type: "emergency" },
    { name: "988 Suicide Crisis Helpline", number: "988", type: "crisis" },
    { name: "Crisis Services Canada", number: "1-833-456-4566", type: "crisis" },
  ]
  
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        <span>
          {t("compact")}
        </span>
      </div>
    )
  }
  
  if (variant === "inline") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {t("title")}
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {t("inlineMessage")}
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  // Banner variant (default)
  return (
    <div className="rounded-lg border-2 border-red-300 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
      <div className="flex items-start gap-4">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-800 dark:text-red-200">
            {t("bannerTitle")}
          </h3>
          <p className="mt-2 text-red-700 dark:text-red-300">
            {t("bannerMessage")}
          </p>
          
          {showCrisisLines && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {crisisLines.map((line) => (
                <a
                  key={line.number}
                  href={`tel:${line.number}`}
                  className="flex items-center gap-2 rounded-md bg-white px-3 py-2 
                    text-sm font-medium text-red-700 shadow-sm 
                    hover:bg-red-100 dark:bg-red-900 dark:text-red-200 
                    dark:hover:bg-red-800"
                >
                  <Phone className="h-4 w-4" />
                  <span>{line.name}</span>
                  <span className="ml-auto font-bold">{line.number}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
