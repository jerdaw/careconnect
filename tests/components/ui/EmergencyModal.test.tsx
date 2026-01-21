import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { EmergencyModal } from "@/components/ui/EmergencyModal"
import { useTranslations } from "next-intl"

// Mock hooks
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}))

describe("EmergencyModal Component", () => {
  const mockOnClose = vi.fn()
  const mockTranslations = (key: string) => key

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTranslations).mockReturnValue(mockTranslations as any)
  })

  it("should not be visible when isOpen is false", () => {
    render(<EmergencyModal isOpen={false} onClose={mockOnClose} />)
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("should display crisis resources when open", () => {
    render(<EmergencyModal isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByText("title")).toBeInTheDocument()
    expect(screen.getByText("message")).toBeInTheDocument()
    expect(screen.getByText("911")).toBeInTheDocument()
    expect(screen.getByText("988")).toBeInTheDocument()
  })

  it("should call onClose when close button is clicked", () => {
    render(<EmergencyModal isOpen={true} onClose={mockOnClose} />)

    // We have two close buttons: one from DialogContent (hidden) and our custom one.
    const closeButtons = screen.getAllByRole("button", { name: /close/i })
    fireEvent.click(closeButtons[0]!)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it("should not be visible when the dialog is closed via Radix (simulated)", () => {
    // Radix handles the backdrop and esc key, so we just check it renders correctly when open
    const { rerender } = render(<EmergencyModal isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText("title")).toBeInTheDocument()

    rerender(<EmergencyModal isOpen={false} onClose={mockOnClose} />)
    expect(screen.queryByText("title")).not.toBeInTheDocument()
  })
})
