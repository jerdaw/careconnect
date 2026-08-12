import { routing } from "@/i18n/routing"
import { PUBLIC_SERVICE_MODE, type PublicServiceMode } from "@/lib/public-service-mode-value"

export { PUBLIC_SERVICE_MODE, type PublicServiceMode }

/**
 * One-way release switch for the prepared public-directory retirement.
 *
 * This branch is intentionally armed for a retirement release, but it must not
 * be deployed until the recovery/dependency preflight and explicit live-change
 * approval recorded in the retirement disposition are complete. Rollback is a
 * release rollback, not a production data mutation.
 */
const HEALTH_PATHS = new Set(["/api/health", "/api/v1/health", "/api/v1/health/probe"])
const supportedLocales = new Set<string>(routing.locales)
const supportedLocalesByLanguageTag = new Map(routing.locales.map((locale) => [locale.toLowerCase(), locale]))

export type PublicServiceRouteDecision =
  | { action: "pass" }
  | { action: "gone" }
  | { action: "rewrite"; pathname: string }

function supportedLocaleForLanguageTag(languageTag: string): string | undefined {
  const normalized = languageTag.trim().toLowerCase()
  const exactLocale = supportedLocalesByLanguageTag.get(normalized)
  if (exactLocale) return exactLocale

  if (normalized === "zh-cn" || normalized === "zh-sg" || normalized.startsWith("zh-hans")) {
    return "zh-Hans"
  }

  return supportedLocalesByLanguageTag.get(normalized.split("-")[0] ?? "")
}

export function resolveRequestLocale(cookieLocale?: string, acceptLanguage?: string | null): string {
  if (cookieLocale && supportedLocales.has(cookieLocale)) return cookieLocale

  const acceptedLanguages = (acceptLanguage ?? "")
    .split(",")
    .map((entry, index) => {
      const [languageTag = "", ...parameters] = entry.trim().split(";")
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="))
      const parsedQuality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1
      return {
        index,
        languageTag,
        quality: Number.isFinite(parsedQuality) ? parsedQuality : 0,
      }
    })
    .filter(({ quality }) => quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index)

  for (const { languageTag } of acceptedLanguages) {
    const locale = supportedLocaleForLanguageTag(languageTag)
    if (locale) return locale
  }

  return routing.defaultLocale
}

export function resolvePublicServiceLocale(pathname: string, preferredLocale?: string): string {
  const pathLocale = pathname.split("/").filter(Boolean)[0]

  if (pathLocale && supportedLocales.has(pathLocale)) {
    return pathLocale
  }

  if (preferredLocale && supportedLocales.has(preferredLocale)) {
    return preferredLocale
  }

  return routing.defaultLocale
}

export function decidePublicServiceRoute(
  pathname: string,
  preferredLocale?: string,
  mode: PublicServiceMode = PUBLIC_SERVICE_MODE
): PublicServiceRouteDecision {
  if (mode === "active") {
    return { action: "pass" }
  }

  if (HEALTH_PATHS.has(pathname)) {
    return { action: "pass" }
  }

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return { action: "gone" }
  }

  const locale = resolvePublicServiceLocale(pathname, preferredLocale)
  const retirementPath = `/${locale}/retired`

  if (pathname === retirementPath || pathname === `${retirementPath}/`) {
    return { action: "pass" }
  }

  return { action: "rewrite", pathname: retirementPath }
}

export function isPublicServiceRetired(mode: PublicServiceMode = PUBLIC_SERVICE_MODE): boolean {
  return mode === "retired"
}
