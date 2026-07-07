import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import FAQPage from "@/app/[locale]/faq/page"
import UserGuidePage from "@/app/[locale]/user-guide/page"
import ImpactPage from "@/app/[locale]/impact/page"
import { createClient } from "@/utils/supabase/server"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"

vi.mock("@/components/layout/Header", () => ({
  Header: () => <header data-testid="static-header" />,
}))

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="static-footer" />,
}))

vi.mock("@/components/ui/section", () => ({
  Section: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/resilience/supabase-breaker", () => ({
  withCircuitBreaker: vi.fn(),
}))

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (arg?: string | { namespace?: string }) => {
    const namespace = typeof arg === "string" ? arg : arg?.namespace
    const dictionaries: Record<string, Record<string, string>> = {
      FAQ: {
        eyebrow: "Help",
        title: "FAQ - CareConnect",
        description: "Frequently asked questions about CareConnect, data verification, and privacy.",
        lastUpdated: "Last reviewed: May 1, 2026",
      },
      UserGuide: {
        eyebrow: "Guide",
        title: "User Guide - CareConnect",
        description: "Learn how to use CareConnect to find local services and support.",
        lastUpdated: "Last reviewed: May 1, 2026",
      },
      Impact: {
        eyebrow: "Community accountability",
        title: "Community Impact",
        subtitle: "See how CareConnect is helping our community-without tracking anyone.",
        metricsTitle: "Last 90 Days",
        satisfactionTitle: "User Satisfaction",
        satisfactionDesc: "Based on {count} responses",
        issuesResolvedTitle: "Issues Resolved",
        issuesResolvedDesc: "Out of {total} reported",
        servicesVerifiedTitle: "Services Verified",
        servicesVerifiedDesc: "Out of {total} total",
        feedbackTitle: "Feedback Received",
        feedbackDesc: "This quarter",
        metricsTemporarilyUnavailable: "Some live impact metrics are temporarily unavailable.",
        privacyTitle: "How We Measure Without Tracking",
        privacyText: "All metrics come from voluntary, anonymous feedback.",
        noTracking: "No IP logging",
        noCookies: "No analytics cookies",
        voluntaryFeedback: "All feedback is optional",
        commitmentTitle: "Our Commitment",
        commitmentText: "We publish these reports quarterly.",
      },
    }

    return (key: string, values?: Record<string, number>) => {
      const value = dictionaries[namespace ?? ""]?.[key] ?? key
      return value.replace("{count}", String(values?.count ?? 0)).replace("{total}", String(values?.total ?? 0))
    }
  }),
}))

describe("Batch C help and impact surfaces", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders FAQ markdown with current service count copy", async () => {
    const page = await FAQPage({ params: Promise.resolve({ locale: "en" }) })

    render(page)

    expect(screen.getByRole("heading", { name: "FAQ - CareConnect" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Frequently Asked Questions (FAQ)" })).not.toBeInTheDocument()
    expect(screen.getByText("Last reviewed: May 1, 2026")).toBeInTheDocument()
    expect(screen.getByText(/Kingston remains live/)).toBeInTheDocument()
    expect(
      screen.getByText(/Brampton starts with a smaller reviewed emergency and core-service set/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/about 200 services/i)).not.toBeInTheDocument()
  })

  it("renders User Guide markdown with current service count copy", async () => {
    const page = await UserGuidePage({ params: Promise.resolve({ locale: "en" }) })

    render(page)

    expect(screen.getByRole("heading", { name: "User Guide - CareConnect" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "CareConnect: User Guide" })).not.toBeInTheDocument()
    expect(screen.getByText("Last reviewed: May 1, 2026")).toBeInTheDocument()
    expect(screen.getByText(/Version:/)).toBeInTheDocument()
    expect(screen.getByText(/203 visible service records/)).toBeInTheDocument()
    expect(screen.getByText(/Brampton coverage begins with a smaller reviewed core-service set/)).toBeInTheDocument()
    expect(screen.queryByText(/about 200 services/i)).not.toBeInTheDocument()
  })

  it("renders impact metrics with a safe degraded state and privacy commitments", async () => {
    vi.mocked(createClient).mockResolvedValue({} as never)
    vi.mocked(withCircuitBreaker).mockRejectedValue(new Error("metrics unavailable"))

    const page = await ImpactPage()

    render(page)

    expect(screen.getByRole("heading", { name: "Community Impact" })).toBeInTheDocument()
    expect(screen.getByText("Some live impact metrics are temporarily unavailable.")).toBeInTheDocument()
    expect(screen.getByText("User Satisfaction")).toBeInTheDocument()
    expect(screen.getByText("How We Measure Without Tracking")).toBeInTheDocument()
    expect(screen.getByText("No IP logging")).toBeInTheDocument()
    expect(screen.getByText("No analytics cookies")).toBeInTheDocument()
    expect(screen.getByText("All feedback is optional")).toBeInTheDocument()
  })

  it("renders the impact degraded state when Supabase configuration is unavailable", async () => {
    vi.mocked(createClient).mockRejectedValue(new Error("Supabase URL and key are required"))

    const page = await ImpactPage()

    render(page)

    expect(screen.getByRole("heading", { name: "Community Impact" })).toBeInTheDocument()
    expect(screen.getByText("Some live impact metrics are temporarily unavailable.")).toBeInTheDocument()
    expect(screen.getByText("How We Measure Without Tracking")).toBeInTheDocument()
  })
})
