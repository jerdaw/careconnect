/** @vitest-environment node */
import { describe, expect, it } from "vitest"
import { findDuplicateEnglishKeys, findUsedKeysInContent } from "@/lib/i18n/audit"

describe("i18n audit helpers", () => {
  it("detects namespaced translation keys from useTranslations and getTranslations", () => {
    const content = `
      const t = useTranslations("Dashboard.overview")
      const tAdmin = await getTranslations("Admin.observability")
      const faq = await getTranslations({ locale, namespace: "FAQ" })
      const root = useTranslations()

      t("totalViews")
      tAdmin("title")
      faq("question1")
      root("Search.food")
    `

    expect([...findUsedKeysInContent(content)].sort()).toEqual([
      "Admin.observability.title",
      "Dashboard.overview.totalViews",
      "FAQ.question1",
      "Search.food",
    ])
  })

  it("flags exact English duplicates only on used keys", () => {
    const sourceMessages = {
      Dashboard: {
        overview: {
          totalViews: "Total Views",
          referrals: "Referrals",
        },
      },
      ServiceDetail: {
        kingston: "Kingston",
      },
    }

    const localeMessages = {
      Dashboard: {
        overview: {
          totalViews: "Total Views",
          referrals: "Renvois",
        },
      },
      ServiceDetail: {
        kingston: "Kingston",
      },
    }

    const duplicates = findDuplicateEnglishKeys(sourceMessages, localeMessages, [
      "Dashboard.overview.totalViews",
      "Dashboard.overview.referrals",
    ])

    expect(duplicates).toEqual(["Dashboard.overview.totalViews"])
  })

  it("respects the duplicate-English allowlist", () => {
    const sourceMessages = {
      ServiceDetail: {
        kingston: "Kingston",
      },
    }

    const localeMessages = {
      ServiceDetail: {
        kingston: "Kingston",
      },
    }

    const duplicates = findDuplicateEnglishKeys(sourceMessages, localeMessages, ["ServiceDetail.kingston"])

    expect(duplicates).toEqual([])
  })
})
