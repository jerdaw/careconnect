import { render, screen, fireEvent } from "@testing-library/react"
import ServiceCard from "@/components/services/ServiceCard"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { TestWrapper } from "@/tests/utils/test-wrapper"
import { mockService } from "@/tests/utils/mocks"

// Mock useUserContext to avoid context errors
vi.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({
    context: { ageGroup: null, identities: [] },
  }),
}))

// Mock analytics
const mockTrackEvent = vi.fn()
vi.mock("@/lib/analytics", () => ({
  trackEvent: (...args: any[]) => mockTrackEvent(...args),
}))

// Mock i18n routing
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean }) => {
    if (asChild) return children
    return <button {...props}>{children}</button>
  },
}))

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode
    href: string
    onClick?: (e: React.MouseEvent) => void
  }) => {
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault() // Prevent navigation in JSDOM
          if (onClick) onClick(e)
        }}
      >
        {children}
      </a>
    )
  },
}))

vi.mock("@/lib/eligibility/checker", () => ({
  checkEligibility: vi.fn().mockReturnValue("eligible"),
}))

describe("ServiceCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders service information correctly", () => {
    render(
      <TestWrapper>
        <ServiceCard service={mockService} />
      </TestWrapper>
    )

    expect(screen.getByText(mockService.name)).toBeInTheDocument()
  })

  it("does not track internal detail navigation as a referral click", () => {
    render(
      <TestWrapper>
        <ServiceCard service={mockService} />
      </TestWrapper>
    )

    const links = screen.getAllByRole("link", { name: /Details/i })
    expect(links.length).toBeGreaterThan(0)

    const link = links[0]
    if (link) fireEvent.click(link)

    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it("tracks call clicks", () => {
    render(
      <TestWrapper>
        <ServiceCard service={mockService} />
      </TestWrapper>
    )

    const phoneLink = screen.getByRole("link", { name: mockService.phone })
    phoneLink.addEventListener("click", (event) => event.preventDefault())
    fireEvent.click(phoneLink)

    expect(mockTrackEvent).toHaveBeenCalledWith(mockService.id, "click_call")
  })

  it("preserves match reasons in the details link", () => {
    render(
      <TestWrapper>
        <ServiceCard
          service={mockService}
          matchReasons={["Fresh Data Boost (+10%)", "Semantic Boost (87%)", "Fresh Data Boost (+10%)"]}
        />
      </TestWrapper>
    )

    const link = screen.getAllByRole("link", { name: /Details/i })[0]
    expect(link).toHaveAttribute(
      "href",
      "/service/test-service-id?matchReason=Fresh+Data+Boost+%28%2B10%25%29&matchReason=Semantic+Boost+%2887%25%29"
    )
  })

  it("renders specialized scope badges", () => {
    const provincialService = { ...mockService, scope: "ontario" as const }
    const { rerender } = render(
      <TestWrapper>
        <ServiceCard service={provincialService} />
      </TestWrapper>
    )
    expect(screen.getAllByText(/Ontario-wide/i)[0]).toBeInTheDocument()

    const nationalService = { ...mockService, scope: "canada" as const }
    rerender(
      <TestWrapper>
        <ServiceCard service={nationalService} />
      </TestWrapper>
    )
    expect(screen.getAllByText(/Canada-wide/i)[0]).toBeInTheDocument()
  })

  it("calls onScopeFilter when scope badge is clicked", () => {
    const onScopeFilter = vi.fn()
    render(
      <TestWrapper>
        <ServiceCard service={{ ...mockService, scope: "ontario" }} onScopeFilter={onScopeFilter} />
      </TestWrapper>
    )

    const badge = screen.getAllByText(/Ontario-wide/i)[0]
    if (badge) fireEvent.click(badge)
    expect(onScopeFilter).toHaveBeenCalledWith("provincial")
  })

  it("renders free fee badge", () => {
    render(
      <TestWrapper>
        <ServiceCard service={{ ...mockService, fees: "Free" }} />
      </TestWrapper>
    )
    expect(screen.getByText(/Free/i)).toBeInTheDocument()
  })

  it("renders identity tags", () => {
    const serviceWithTags = {
      ...mockService,
      identity_tags: [
        { tag: "Youth", evidence_url: "" },
        { tag: "LGBTQ+", evidence_url: "" },
      ],
    }
    render(
      <TestWrapper>
        <ServiceCard service={serviceWithTags} />
      </TestWrapper>
    )
    expect(screen.getByText("Youth")).toBeInTheDocument()
    expect(screen.getByText("LGBTQ+")).toBeInTheDocument()
  })

  it("renders crisis icon for crisis category", () => {
    render(
      <TestWrapper>
        <ServiceCard service={{ ...mockService, intent_category: "Crisis" as any }} />
      </TestWrapper>
    )
    // Lucide AlertTriangle is used for Crisis. In JSDOM we can't easily check the icon but we can check container
    expect(screen.getByText(/Crisis/i)).toBeInTheDocument()
  })

  it("displays distance when provided", () => {
    render(
      <TestWrapper>
        <ServiceCard service={{ ...mockService, distance: 1.5 }} />
      </TestWrapper>
    )
    expect(screen.getByText("1.5 km")).toBeInTheDocument()
  })

  it("surfaces match reasons and reveals additional reasons on demand", () => {
    render(
      <TestWrapper>
        <ServiceCard
          service={mockService}
          matchReasons={[
            " Fresh Data Boost (+10%) ",
            "Semantic Boost (87%)",
            "Authority Boost (+20%)",
            "semantic boost (87%)",
          ]}
        />
      </TestWrapper>
    )

    expect(screen.getByText("Why this matched")).toBeInTheDocument()
    expect(screen.getByText("Fresh Data Boost (+10%)")).toBeInTheDocument()
    expect(screen.getByText("Semantic Boost (87%)")).toBeInTheDocument()
    expect(screen.queryByText("Authority Boost (+20%)")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "See more match reasons" }))

    expect(screen.getByText("Authority Boost (+20%)")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Hide extra match reasons" }))

    expect(screen.queryByText("Authority Boost (+20%)")).not.toBeInTheDocument()
  })

  it("opens feedback modal when report is clicked", () => {
    render(
      <TestWrapper>
        <ServiceCard service={mockService} />
      </TestWrapper>
    )

    const reportBtn = screen.getByText(/Report/i)
    fireEvent.click(reportBtn)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Report Issue")).toBeInTheDocument()
  })
})
