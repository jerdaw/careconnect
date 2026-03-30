import { defineRouting } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"

export const routing = defineRouting({
  /**
   * Multi-lingual support: 7 locales for EDIA (Equity, Diversity, Inclusion, Accessibility) goals
   *
   * - en: English (Canadian context)
   * - fr: Français canadien / Canadian French (fr-CA dialect, NOT France French)
   * - ar: Arabic (RTL support enabled)
   * - zh-Hans: Simplified Chinese
   * - pt: Portuguese
   * - es: Spanish
   * - pa: Punjabi
   *
   * Note: Local Kingston services have EN/FR translations only.
   * UI copy is available in all 7 locales.
   */
  locales: ["en", "fr", "zh-Hans", "ar", "pt", "es", "pa"],

  // Used when no locale matches
  defaultLocale: "en",
})

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
