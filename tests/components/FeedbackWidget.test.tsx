import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget"
import { TestWrapper } from "@/tests/utils/test-wrapper"

// Mock Toast
const mockToast = vi.fn()
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock ReportIssueModal
vi.mock("@/components/feedback/ReportIssueModal", () => ({
  ReportIssueModal: () => <div data-testid="report-issue-modal" />,
}))

// Mock fetch
global.fetch = vi.fn()

const mockFeedbackMessages = {
  widgetTitle: "Was this helpful?",
  widgetSubtitle: "Help us improve",
  yes: "Yes",
  no: "No",
  reportIssue: "Report Problem",
  alreadyVotedMessage: "Thanks for voting!",
  voteSuccessTitle: "Success",
  voteSuccessMessage: "Vote saved",
  errorTitle: "Error",
  errorMessage: "Something went wrong",
}

describe("FeedbackWidget Component", () => {
  const serviceId = "svc-123"
  const serviceName = "Test Service"

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({ ok: true })
  })

  it("renders with vote buttons", () => {
    render(
      <TestWrapper messages={{ Feedback: mockFeedbackMessages } as any}>
        <FeedbackWidget serviceId={serviceId} serviceName={serviceName} />
      </TestWrapper>
    )

    expect(screen.getByText("Was this helpful?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument()
  })

  it("submits helpful vote", async () => {
    render(
      <TestWrapper messages={{ Feedback: mockFeedbackMessages } as any}>
        <FeedbackWidget serviceId={serviceId} serviceName={serviceName} />
      </TestWrapper>
    )

    fireEvent.click(screen.getByRole("button", { name: "Yes" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/feedback",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            service_id: serviceId,
            feedback_type: "helpful_yes",
          }),
        })
      )
    })

    expect(screen.getByText("Thanks for voting!")).toBeInTheDocument()
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Success" }))
  })

  it("handles fetch error", async () => {
    ;(global.fetch as any).mockResolvedValue({ ok: false })

    render(
      <TestWrapper messages={{ Feedback: mockFeedbackMessages } as any}>
        <FeedbackWidget serviceId={serviceId} serviceName={serviceName} />
      </TestWrapper>
    )

    fireEvent.click(screen.getByRole("button", { name: "Yes" }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }))
    })
  })

  it("opens dialog on click", () => {
    render(
      <TestWrapper messages={{ Feedback: mockFeedbackMessages }}>
        <FeedbackWidget serviceId={serviceId} serviceName={serviceName} />
      </TestWrapper>
    )

    fireEvent.click(screen.getByRole("button", { name: /Report Problem/i }))

    expect(screen.getByTestId("report-issue-modal")).toBeInTheDocument()
  })
})
