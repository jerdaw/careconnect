import { defineRouting } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"

export const routing = defineRouting({
  /**
   * Multi-lingual support: 5 languages for EDIA (Equity, Diversity, Inclusion, Accessibility) goals
   *
   * - en: English (Canadian context)
   * - fr: Français canadien / Canadian French (fr-CA dialect, NOT France French)
   * - ar: Arabic (RTL support enabled)
   * - zh-Hans: Simplified Chinese
   * - es: Spanish
   *
   * Note: Local Kingston services have EN/FR translations only.
   * Provincial services have all 5 languages for name/description/eligibility.
   */
  locales: ["en", "fr", "ar", "zh-Hans", "es"],

  // Used when no locale matches
  defaultLocale: "en",
})

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
