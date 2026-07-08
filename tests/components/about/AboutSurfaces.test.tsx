import { describe, it, expect } from "vitest"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { renderWithProviders, screen } from "@/tests/utils/test-wrapper"
import AboutTrustOverview from "@/components/about/AboutTrustOverview"
import enMessages from "@/messages/en.json"

function AboutCopyProbe() {
  const t = useTranslations("About")

  return (
    <section>
      <h1>{t("hero.title")}</h1>
      <p>{t("hero.subtitle")}</p>
      <Link href="/">{t("hero.primaryCta")}</Link>
      <Link href="/about/partners">{t("hero.secondaryCta")}</Link>
    </section>
  )
}

function PartnersCopyProbe() {
  const t = useTranslations("PartnersPage")

  return (
    <section>
      <h1>{t("hero.title")}</h1>
      <p>{t("hero.subtitle")}</p>
      <h2>{t("sources.title")}</h2>
      <p>{t("sources.items.twoOneOne.description")}</p>
      <h2>{t("review.title")}</h2>
      <p>{t("review.steps.maintenance.description")}</p>
      <Link href="/submit-service">{t("cta.button")}</Link>
      <Link href="/">{t("cta.search")}</Link>
    </section>
  )
}

describe("About page surfaces", () => {
  it("renders current About hero copy without stale milestone language", () => {
    renderWithProviders(<AboutCopyProbe />, { messages: enMessages })

    expect(screen.getByRole("heading", { name: /private directory/i })).toBeInTheDocument()
    expect(screen.getByText(/without accounts, tracking, or extra steps/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Search services" })).toHaveAttribute("href", "/")
    expect(screen.queryByText(/Kingston 150/i)).not.toBeInTheDocument()
  })

  it("renders trust and boundary content as one cohesive About surface", () => {
    renderWithProviders(<AboutTrustOverview />, { messages: enMessages })

    expect(screen.getByRole("heading", { name: "Built for verified, private discovery" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Reference sources/i })).toHaveAttribute("href", "/en/about/partners")
    expect(screen.getByRole("heading", { name: "What CareConnect does and doesn't do" })).toBeInTheDocument()
    expect(screen.getByText("Search verified social-service listings")).toBeInTheDocument()
    expect(screen.getByText("Guarantee hours, eligibility, or real-time availability")).toBeInTheDocument()
  })

  it("renders reference source copy as a review model rather than a partner claim", () => {
    renderWithProviders(<PartnersCopyProbe />, { messages: enMessages })

    expect(screen.getByRole("heading", { name: "How CareConnect reviews source information" })).toBeInTheDocument()
    expect(screen.getByText(/not presented as an endorsement, sponsorship, or partnership/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Sources used to support review" })).toBeInTheDocument()
    expect(screen.getByText(/Province-wide social-service directory reference/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "How references become verified listings" })).toBeInTheDocument()
    expect(screen.getByText(/fed back into periodic review/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Suggest a service" })).toHaveAttribute("href", "/submit-service")
    expect(screen.getByRole("link", { name: "Search services" })).toHaveAttribute("href", "/")
  })
})
