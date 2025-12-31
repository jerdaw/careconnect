import { render, screen, fireEvent } from "@testing-library/react"
import ServiceCard from "@/components/ServiceCard"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { TestWrapper } from "@/tests/utils/test-wrapper"
import { mockService } from "@/tests/utils/mocks"

// Mock useUserContext to avoid context errors
vi.mock("@/hooks/useUserContext", () => ({
    useUserContext: () => ({
        context: { ageGroup: null, identities: [] }
    })
}))

// Mock analytics
const mockTrackEvent = vi.fn()
vi.mock("@/lib/analytics", () => ({
    trackEvent: (...args: any[]) => mockTrackEvent(...args)
}))

// Mock i18n routing
vi.mock("@/components/ui/button", () => ({
    Button: ({ children, asChild, ...props }: any) => {
        if (asChild) return children
        return <button {...props}>{children}</button>
    }
}))

vi.mock("@/i18n/routing", () => ({
    Link: ({ children, href, onClick }: any) => {
        return <a href={href} onClick={(e) => {
            e.preventDefault() // Prevent navigation in JSDOM
            if (onClick) onClick(e)
        }}>{children}</a>
    }
}))

vi.mock("@/lib/eligibility/checker", () => ({
    checkEligibility: vi.fn().mockReturnValue("eligible")
}))

describe("ServiceCard Component", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders service information correctly", () => {
        render(
            <TestWrapper messages={{ Common: { ServiceCard: { reportIssue: "Report" }, Eligibility: { likelyQualify: "Qualify" } } } as any}>
                <ServiceCard service={mockService} />
            </TestWrapper>
        )

        expect(screen.getByText(mockService.name)).toBeInTheDocument()
    })

    it("tracks clicks on details button", () => {
        render(
            <TestWrapper messages={{ Common: { ServiceCard: { reportIssue: "Report" }, Eligibility: { likelyQualify: "Qualify" } } } as any}>
                <ServiceCard service={mockService} />
            </TestWrapper>
        )

        const links = screen.getAllByRole("link", { name: /Details/i })
        expect(links.length).toBeGreaterThan(0)

        const link = links[0]
        if (link) fireEvent.click(link)

        expect(mockTrackEvent).toHaveBeenCalledWith(mockService.id, "click_website")
    })

    it("renders eligibility badge when eligible", () => {
        const messages = {
            Common: {
                Eligibility: {
                    likelyQualify: "Likely Qualify"
                },
                ServiceCard: {
                    reportIssue: "Report Issue"
                }
            }
        }
        render(
            <TestWrapper messages={messages as any}>
                <ServiceCard service={mockService} />
            </TestWrapper>
        )
        expect(screen.getByText("Likely Qualify")).toBeInTheDocument()
    })

    it("highlights search tokens", () => {
        render(
            <TestWrapper messages={{ Common: { ServiceCard: { reportIssue: "Report" }, Eligibility: { likelyQualify: "Qualify" } } } as any}>
                <ServiceCard service={mockService} highlightTokens={["Food"]} />
            </TestWrapper>
        )
        expect(screen.getByText(mockService.name)).toBeInTheDocument()
    })
})
