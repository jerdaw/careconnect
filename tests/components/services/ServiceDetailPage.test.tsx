import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ServicePage from "@/app/[locale]/service/[id]/page"
import { getServiceById } from "@/lib/services"
import { mockService } from "@/tests/utils/mocks"

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}))

vi.mock("@/lib/services", () => ({
  getServiceById: vi.fn(),
}))

vi.mock("next-intl/server", () => ({
  getTranslations: vi
    .fn()
    .mockResolvedValue((key: string, values?: Record<string, string>) =>
      values?.name ? `${key}:${values.name}` : key
    ),
}))

vi.mock("@/components/layout/Header", () => ({
  Header: () => <div data-testid="header" />,
}))

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <div data-testid="footer" />,
}))

vi.mock("@/components/ui/section", () => ({
  Section: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}))

vi.mock("@/components/ui/EmergencyDisclaimer", () => ({
  EmergencyDisclaimer: () => <div data-testid="emergency-disclaimer" />,
}))

vi.mock("@/components/partner/ClaimFlow", () => ({
  ClaimFlow: ({ serviceName }: { serviceName: string }) => <div data-testid="claim-flow">{serviceName}</div>,
}))

vi.mock("@/components/services/PartnerActionsPanel", () => ({
  PartnerActionsPanel: ({ serviceId }: { serviceId: string }) => (
    <div data-testid="partner-actions-panel">{serviceId}</div>
  ),
}))

vi.mock("@/components/feedback/FeedbackWidget", () => ({
  FeedbackWidget: ({ serviceId }: { serviceId: string }) => <div data-testid="feedback-widget">{serviceId}</div>,
}))

vi.mock("@/components/services/TrustPanel", () => ({
  TrustPanel: ({ service }: { service: { id: string } }) => <div data-testid="trust-panel">{service.id}</div>,
}))

vi.mock("@/components/services/ServiceActionBar", () => ({
  ServiceActionBar: () => <div data-testid="service-action-bar" />,
}))

vi.mock("@/components/services/SimplifiedServiceView", () => ({
  SimplifiedServiceView: () => <div data-testid="simplified-service-view" />,
}))

vi.mock("@/components/services/ServiceMatchReasons", () => ({
  default: ({ reasons }: { reasons: string[] }) => <div data-testid="service-match-reasons">{reasons.join("|")}</div>,
}))

describe("Service detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServiceById).mockResolvedValue({
      ...mockService,
      email: "",
      phone: "",
      url: "",
    })
  })

  it("keeps canonical feedback entrypoints and removes the feedback mailto link", async () => {
    const page = await ServicePage({
      params: Promise.resolve({ id: mockService.id, locale: "en" }),
      searchParams: Promise.resolve({}),
    })

    const { container } = render(page)

    expect(screen.getByTestId("trust-panel")).toHaveTextContent(mockService.id)
    expect(screen.getByTestId("partner-actions-panel")).toHaveTextContent(mockService.id)
    expect(screen.getByTestId("feedback-widget")).toHaveTextContent(mockService.id)
    expect(screen.getByRole("button", { name: "loadMapPreview" })).toBeInTheDocument()
    expect(container.querySelector('a[href^="mailto:"]')).not.toBeInTheDocument()
    expect(container.querySelector('iframe[src*="maps.google.com"]')).not.toBeInTheDocument()
  })

  it("renders search match reasons passed through the detail route", async () => {
    const page = await ServicePage({
      params: Promise.resolve({ id: mockService.id, locale: "en" }),
      searchParams: Promise.resolve({
        matchReason: [" Fresh Data Boost (+10%) ", "Semantic Boost (87%)", "semantic boost (87%)"],
      }),
    })

    render(page)

    expect(screen.getByTestId("service-match-reasons")).toHaveTextContent(
      "Fresh Data Boost (+10%)|Semantic Boost (87%)"
    )
  })

  it("renders an explicit stale-data warning for records beyond the governance window", async () => {
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 200)

    vi.mocked(getServiceById).mockResolvedValueOnce({
      ...mockService,
      email: "",
      phone: "",
      url: "",
      last_verified: expiredDate.toISOString(),
      provenance: {
        ...mockService.provenance,
        verified_at: expiredDate.toISOString(),
      },
    })

    const page = await ServicePage({
      params: Promise.resolve({ id: mockService.id, locale: "en" }),
      searchParams: Promise.resolve({}),
    })

    render(page)

    expect(screen.getByText("staleRecordTitle")).toBeInTheDocument()
    expect(screen.getByText("staleRecordDescription")).toBeInTheDocument()
  })
})
