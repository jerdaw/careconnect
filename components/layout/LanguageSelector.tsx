"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "../../i18n/routing"

const LOCALES = [
  { code: "en", label: "English", flag: "🇨🇦" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "zh-Hans", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
]

export function LanguageSelector() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as "en" | "fr" | "ar" | "zh-Hans" | "es" })
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none rounded-md border border-neutral-200 bg-white px-3 py-1.5 pr-8 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600"
        aria-label="Select language"
      >
        {LOCALES.map((loc) => (
          <option key={loc.code} value={loc.code}>
            {loc.flag} {loc.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <svg
          className="h-4 w-4 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
