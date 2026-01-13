import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { TrustPanel } from "@/components/services/TrustPanel"
import { TestWrapper } from "@/tests/utils/test-wrapper"
import { mockService } from "@/tests/utils/mocks"
import { VerificationLevel } from "@/types/service"

// Mock UpdateRequestModal to avoid complex UI rendering
vi.mock("@/components/services/UpdateRequestModal", () => ({
  UpdateRequestModal: () => <div data-testid="update-request-modal" />
}))

const mockTrustMessages = {
  title: "Verification Information",
  lastVerified: "Last Verified",
  verifiedBy: "Verified By",
  method: "Method",
  evidence: "Evidence",
  viewEvidence: "View Evidence",
  updateHint: "Report wrong info",
  unknown: "Unknown",
  methods: {
    phone: "Phone",
    email: "Email",
    site: "Website"
  }
}

const mockVerificationMessages = {
  L0: "Unverified",
  L1: "Basic",
  L2: "Verified",
  L3: "Partner Verified",
  L4: "Audited"
}

describe("TrustPanel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders basic trust information", () => {
    const service = {
      ...mockService,
      verification_level: VerificationLevel.L2,
      last_verified: "2026-01-01T00:00:00Z",
      provenance: {
        verified_by: "KCC Admin",
        method: "phone",
        verified_at: "2026-01-01T00:00:00Z",
        evidence_url: ""
      }
    }

    render(
      <TestWrapper messages={{ Trust: mockTrustMessages, VerificationLevels: mockVerificationMessages } as any}>
        <TrustPanel service={service} locale="en" />
      </TestWrapper>
    )

    expect(screen.getByText("Verification Information")).toBeInTheDocument()
    expect(screen.getByText("Verified")).toBeInTheDocument()
    expect(screen.getByText("KCC Admin")).toBeInTheDocument()
    expect(screen.getByText("Phone")).toBeInTheDocument()
  })

  it("opens update request modal when hint is clicked", () => {
    render(
      <TestWrapper messages={{ Trust: mockTrustMessages, VerificationLevels: mockVerificationMessages } as any}>
        <TrustPanel service={mockService} locale="en" />
      </TestWrapper>
    )

    const button = screen.getByText("Report wrong info")
    fireEvent.click(button)

    expect(screen.getByTestId("update-request-modal")).toBeInTheDocument()
  })

  it("renders evidence link if provided", () => {
    const service = {
      ...mockService,
      provenance: {
        evidence_url: "https://example.com",
        verified_by: "Tester",
        verified_at: "2026-01-01T00:00:00Z",
        method: "site"
      }
    }

    render(
      <TestWrapper messages={{ Trust: mockTrustMessages, VerificationLevels: mockVerificationMessages } as any}>
        <TrustPanel service={service} locale="en" />
      </TestWrapper>
    )

    const link = screen.getByRole("link", { name: /View Evidence/i })
    expect(link).toHaveAttribute("href", "https://example.com")
  })
})
