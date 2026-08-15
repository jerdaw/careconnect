import { describe, expect, it } from "vitest"
import {
  PUBLIC_SERVICE_MODE,
  decidePublicServiceRoute,
  isPublicServiceRetired,
  resolvePublicServiceLocale,
  resolveRequestLocale,
} from "@/lib/public-service-mode"

describe("public service retirement policy", () => {
  it("arms the draft release for retirement without relying on a live environment variable", () => {
    expect(PUBLIC_SERVICE_MODE).toBe("retired")
    expect(isPublicServiceRetired()).toBe(true)
  })

  it("rewrites interactive routes to the correct localized retirement page", () => {
    expect(decidePublicServiceRoute("/fr/service/example", undefined, "retired")).toEqual({
      action: "rewrite",
      pathname: "/fr/retired",
    })
    expect(decidePublicServiceRoute("/about", "pa", "retired")).toEqual({
      action: "rewrite",
      pathname: "/pa/retired",
    })
  })

  it("fails non-health APIs closed and preserves only the health contract", () => {
    expect(decidePublicServiceRoute("/api/v1/services", "en", "retired")).toEqual({ action: "gone" })
    expect(decidePublicServiceRoute("/api/v1/search/services", "en", "retired")).toEqual({ action: "gone" })

    for (const pathname of ["/api/health", "/api/v1/health", "/api/v1/health/probe"]) {
      expect(decidePublicServiceRoute(pathname, "en", "retired")).toEqual({ action: "pass" })
    }
  })

  it("does not rewrite the retirement route again", () => {
    expect(decidePublicServiceRoute("/zh-Hans/retired", undefined, "retired")).toEqual({ action: "pass" })
    expect(decidePublicServiceRoute("/zh-Hans/retired/", undefined, "retired")).toEqual({ action: "pass" })
  })

  it("defaults unsupported locale input to English", () => {
    expect(resolvePublicServiceLocale("/unsupported/path", "unsupported")).toBe("en")
  })

  it("respects quality ordering and cookie precedence for request locales", () => {
    expect(resolveRequestLocale(undefined, "en;q=0.4,fr-CA;q=0.9")).toBe("fr")
    expect(resolveRequestLocale("pa", "fr-CA,fr;q=0.9")).toBe("pa")
    expect(resolveRequestLocale(undefined, "zh-CN")).toBe("zh-Hans")
  })

  it("keeps the complete active routing contract available to a release rollback", () => {
    for (const pathname of ["/en", "/fr/service/example", "/api/v1/services", "/auth/callback"]) {
      expect(decidePublicServiceRoute(pathname, "en", "active")).toEqual({ action: "pass" })
    }
    expect(isPublicServiceRetired("active")).toBe(false)
  })
})
