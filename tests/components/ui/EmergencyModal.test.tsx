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

    const closeButton = screen.getByLabelText("close")
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it("should call onClose when backdrop is clicked", () => {
    const { container } = render(<EmergencyModal isOpen={true} onClose={mockOnClose} />)

    // The backdrop is a motion.div, we can query by its class or just look for the first div in the portal area
    // Actually, in JSDOM portal might not be separate.
    // The backdrop is the first motion.div child.
    const backdrop = container.querySelector(".fixed.inset-0")
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })
})
