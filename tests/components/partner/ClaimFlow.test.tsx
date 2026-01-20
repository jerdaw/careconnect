import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ClaimFlow } from "@/components/partner/ClaimFlow"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"

// Mock hooks
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}))
vi.mock("@/components/ui/use-toast", () => ({
  useToast: vi.fn(),
}))

describe("ClaimFlow Component", () => {
  const mockToast = vi.fn()
  const mockTranslations = (key: string) => key

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTranslations).mockReturnValue(mockTranslations as any)
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any)
    // vi.useFakeTimers()
  })

  afterEach(() => {
    // vi.useRealTimers()
  })

  it("renders the claim button", () => {
    render(<ClaimFlow serviceId="1" serviceName="Test Service" />)
    expect(screen.getByText("button")).toBeInTheDocument()
  })

  it("opens dialog on click", () => {
    render(<ClaimFlow serviceId="1" serviceName="Test Service" />)
    fireEvent.click(screen.getByText("button"))
    expect(screen.getByText("title")).toBeInTheDocument()
  })

  it("requires agreement before proceeding to step 2", () => {
    render(<ClaimFlow serviceId="1" serviceName="Test Service" />)
    fireEvent.click(screen.getByText("button"))

    const nextButton = screen.getByText("submit")
    expect(nextButton).toBeDisabled()

    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)

    expect(nextButton).not.toBeDisabled()
    fireEvent.click(nextButton)

    expect(screen.getByLabelText("Work Email")).toBeInTheDocument()
  })

  it("submits the claim on step 2", async () => {
    render(<ClaimFlow serviceId="1" serviceName="Test Service" />)
    fireEvent.click(screen.getByText("button"))

    // Step 1
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByText("submit"))

    // Step 2
    const emailInput = screen.getByLabelText("Work Email")
    fireEvent.change(emailInput, { target: { value: "test@org.com" } })

    const submitButton = screen.getByText("Submit Claim")
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()

    await waitFor(
      () => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "success" }))
      },
      { timeout: 3000 }
    )
  })
})
