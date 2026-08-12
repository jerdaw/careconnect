import { routing } from "@/i18n/routing"

export type PublicServiceMode = "active" | "retired"

/**
 * One-way release switch for the prepared public-directory retirement.
 *
 * This branch is intentionally armed for a retirement release, but it must not
 * be deployed until the recovery/dependency preflight and explicit live-change
 * approval recorded in the retirement disposition are complete. Rollback is a
 * release rollback, not a production data mutation.
 */
export const PUBLIC_SERVICE_MODE: PublicServiceMode = "retired"

const HEALTH_PATHS = new Set(["/api/health", "/api/v1/health", "/api/v1/health/probe"])
const supportedLocales = new Set<string>(routing.locales)

export type PublicServiceRouteDecision =
  | { action: "pass" }
  | { action: "gone" }
  | { action: "rewrite"; pathname: string }

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
